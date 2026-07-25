const { Jimp } = require('jimp');
const fileType = require('file-type'); // Or whatever bailey uses
async function run() {
    const bg = new Jimp({ width: 100, height: 100, color: '#118EE9' });
    const buf = await bg.getBuffer('image/png');
    console.log("Buffer length:", buf.length);
    console.log("Buffer slice:", buf.slice(0, 10));
}
run();
