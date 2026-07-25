const { Jimp } = require('jimp');
async function run() {
    const bg = new Jimp({ width: 100, height: 100, color: '#118EE9' });
    const buf = await bg.getBuffer("image/png");
    console.log(buf.slice(0, 16));
}
run().catch(console.error);
