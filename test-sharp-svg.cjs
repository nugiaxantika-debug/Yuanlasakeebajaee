const sharp = require('sharp');
const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="red" />
    </svg>
`;
sharp(Buffer.from(svg)).png().toBuffer().then(() => console.log("Success")).catch(e => console.error("Error:", e.message));

const svgTrimmed = svg.trim();
sharp(Buffer.from(svgTrimmed)).png().toBuffer().then(() => console.log("Success Trimmed")).catch(e => console.error("Error Trimmed:", e.message));
