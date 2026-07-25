const sharp = require('sharp');
const fs = require('fs');

async function run() {
    const templateBuffer = fs.readFileSync('public/templates/fakedana.png');
    const width = 1080;
    const height = 2400;
    const nominal = "14.841";

    const textSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <text x="160" y="195" font-family="sans-serif" font-size="36" fill="white">Rp</text>
            <text x="220" y="200" font-family="sans-serif" font-size="64" fill="white" font-weight="bold">${nominal}</text>
        </svg>
    `;

    await sharp(templateBuffer)
        .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
        .png()
        .toFile('test-dana-ultra-result.png');
    console.log("Created test-dana-ultra-result.png");
}

run();
