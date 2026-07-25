const { Jimp } = require('jimp');
async function run() {
    const bg = new Jimp({ width: 100, height: 100, color: '#118EE9' });
    const buf = await bg.getBuffer("image/png");
    console.log("Is Buffer:", Buffer.isBuffer(buf));
    console.log("Is Uint8Array:", buf instanceof Uint8Array);
}
run().catch(console.error);
