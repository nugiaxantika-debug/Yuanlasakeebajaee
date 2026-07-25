const sharp = require('sharp');
const fs = require('fs');

async function run() {
    const bg = `<svg width="200" height="200"><rect width="200" height="200" fill="blue"/></svg>`;
    const fg = `
        <svg width="200" height="200">
            <rect width="100" height="100" fill="red"/>
        </svg>
    `;
    
    try {
        await sharp(Buffer.from(bg.trim()))
            .composite([{ input: Buffer.from(fg) }])
            .png()
            .toBuffer();
        console.log("Composite success");
    } catch (e) {
        console.error("Composite error:", e.message);
    }
}
run();
