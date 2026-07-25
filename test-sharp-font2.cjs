const sharp = require('sharp');
const fs = require('fs');

async function test() {
  const svg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="40" font-family="Arial, sans-serif" font-size="30" fill="black">Hello World</text>
  </svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync('test-font2.png', buffer);
  console.log("Size:", buffer.length);
}
test().catch(console.error);
