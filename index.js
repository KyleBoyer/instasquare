const myargs = process.argv.slice(2);
const fs = require('fs');
const Path = require('path');
const Jimp = require('jimp');
const loadImage = p => new Promise((resolve, reject) => Jimp.read(p).then(resolve).catch(reject));
const getImageSize = i => ({
    width: i.bitmap.width,
    height: i.bitmap.height
});
const isImageSquare = i => getImageSize(i).height === getImageSize(i).width;
const newSquare = (dimention, color) => new Promise((resolve, reject) => {
    new Jimp(dimention, dimention, color, (err, image) => {
        if (err) {
            reject(err);
        } else {
            resolve(image);
        }
    });
});
const isOdd = n => (Math.abs(n % 2) == 1);
const scaleImage = (i, scaleBy) => new Promise((resolve, reject) => {
    i.scale(scaleBy, (err, image) => {
        if (err) {
            reject(err);
        } else {
            resolve(image);
        }
    });
})
const makeImageSquare = async (jimpImg, extraColor = '#ffffff') => {
    if (isImageSquare(jimpImg)) {
        return jimpImg;
    }
    const oldImageSize = getImageSize(jimpImg);
    var scaleBy = 1;
    var newSquareSize = Math.max(oldImageSize.height, oldImageSize.width);
    if (isOdd(newSquareSize)) {
        newSquareSize = newSquareSize * 2;
        scaleBy = 2;
    }
    const newImage = await newSquare(newSquareSize, extraColor);
    const oldImageScaled = scaleBy != 1 ? (await scaleImage(jimpImg, scaleBy)) : jimpImg;
    const oldImageScaledSize = getImageSize(oldImageScaled);
    const newX = ((newSquareSize - oldImageScaledSize.width) / 2);
    const newY = ((newSquareSize - oldImageScaledSize.height) / 2);

    return (await (new Promise((resolve, reject) => {
        newImage.composite(oldImageScaled, newX, newY, {
            opacitySource: 1,
            opacityDest: 1
        }, (err, image) => {
            if (err) {
                reject(err);
            } else {
                resolve(image);
            }
        });
    })));
};
if (myargs.length > 0 && fs.existsSync(myargs[0])) {
    const inPath = Path.parse(myargs[0]);
    const outPath = Path.join(inPath.dir, (inPath.name + '-square' + inPath.ext));
    (async (inFile, outFile, infill) => {
        const loaded = await loadImage(inFile);
        const square = await makeImageSquare(loaded, infill);
        square.write(outFile);
        console.log('Done!');
    })(myargs[0], outPath, (myargs.length > 1 ? myargs[1] : 'white'));
} else {
    console.error("Invalid usage! The first argument must be the image to convert to a square. Optionally the second argument can be an infill color.");
    process.exit(1);
}