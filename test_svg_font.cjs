const sharp = require('sharp');
const fs = require('fs');
async function run() {
    const svg = `<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
    <style>
      text { font-family: sans-serif; }
    </style>
    <text x="10" y="30" font-size="20">Hello World!</text>
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile('test_font.png');
    console.log("Done");
}
run();
