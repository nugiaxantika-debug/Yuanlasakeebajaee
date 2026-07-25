const { Jimp, loadFont } = require('jimp');
const { SANS_64_WHITE, SANS_64_BLACK } = require('jimp/fonts');

async function run() {
    const bg = new Jimp({ width: 1080, height: 2400, color: '#118EE9' });
    const font = await loadFont(SANS_64_WHITE);
    bg.print({ font, x: 160, y: 195, text: "Rp 1.000.000" });
    await bg.write('test-jimp.png');
    console.log("Success");
}
run().catch(console.error);
