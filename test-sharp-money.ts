import sharp from "sharp";
const svgText = `
                <svg width="600" height="1200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="1200" fill="#118ee9"/>
                  <text x="50%" y="30%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">Fake DANA</text>
                </svg>
            `;
sharp(Buffer.from(svgText)).png().toBuffer().then(() => console.log('success')).catch(console.error);
