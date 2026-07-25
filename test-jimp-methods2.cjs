const { Jimp } = require('jimp');
async function run() {
    const bg = new Jimp({ width: 100, height: 100, color: '#118EE9' });
    try {
        const buf = await bg.getBuffer("image/png");
        console.log("Success with 'image/png'");
    } catch(e) {
        console.error("Error 'image/png':", e.message);
    }
}
run().catch(console.error);
