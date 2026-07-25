const { Jimp } = require('jimp');
async function run() {
    const bg = new Jimp({ width: 100, height: 100, color: '#118EE9' });
    console.log(typeof bg.getBuffer);
    console.log(typeof bg.getBufferAsync);
}
run().catch(console.error);
