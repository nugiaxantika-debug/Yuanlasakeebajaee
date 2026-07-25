const Jimp = require('jimp');

async function run() {
    const bg = new Jimp(1080, 2400, '#118EE9');
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    bg.print(font, 160, 195, "Rp 1.000.000");
    await bg.writeAsync('test-jimp.png');
    console.log("Success");
}
run().catch(console.error);
