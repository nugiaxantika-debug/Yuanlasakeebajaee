const { Jimp, loadFont } = require('jimp');
const { SANS_64_WHITE, SANS_64_BLACK } = require('jimp/fonts');
const path = require('path');

async function run() {
    const bg = await Jimp.read(path.join('public', 'templates', 'fakedana.png'));
    const font = await loadFont(SANS_64_WHITE);
    bg.print({ font, x: 220, y: 155, text: "1.000.000" });
    const buffer = await bg.getBuffer('image/png');
    console.log("Success buffer size:", buffer.length);
}
run().catch(console.error);
