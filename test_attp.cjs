const sharp = require('sharp');
async function test() {
    try {
        const safeText = "test";
        const svgMeme = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          <rect width="512" height="512" fill="transparent"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#ff0055">${safeText}</text>
        </svg>`;
        const bgBuffer = Buffer.from(svgMeme);
        const pngBuffer = await sharp(bgBuffer).png().toBuffer();
        const { Sticker } = await import('wa-sticker-formatter');
        const sticker = new Sticker(pngBuffer, { pack: 'ATTP', author: 'Bot', type: 'full' });
        const finalBuffer = await sticker.toBuffer();
        console.log("Success, buffer size:", finalBuffer.length);
    } catch(e) { console.log(e) }
}
test();
