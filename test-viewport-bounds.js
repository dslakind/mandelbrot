// Quick test of viewport bounds
const aspectRatio = 16 / 9;
const width = 3.0;
const height = width / aspectRatio;
const centerRe = -0.5;
const centerIm = 0;

console.log('Aspect ratio:', aspectRatio);
console.log('Width:', width);
console.log('Height:', height);
console.log('Center Re:', centerRe);
console.log('Center Im:', centerIm);

const minRe = centerRe - width / 2;
const maxRe = centerRe + width / 2;
const minIm = centerIm - height / 2;
const maxIm = centerIm + height / 2;

console.log('\nBounds:');
console.log('Real: [', minRe, ',', maxRe, ']');
console.log('Imaginary: [', minIm, ',', maxIm, ']');
console.log('\nExpected:');
console.log('Real: [-2, 1]');
console.log('Imaginary: [-1.5, 1.5] (approx, depends on aspect ratio)');
