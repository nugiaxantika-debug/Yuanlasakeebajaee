const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /const boxX = Math\.round\(width \* 0\.10\);[\s\S]*?textSvg = `/;
const replacement = `const boxX = Math.round(width * 0.11);
                    const boxY = Math.round(height * 0.045);
                    const boxW = Math.round(width * 0.45);
                    const boxH = Math.round(height * 0.065);
                    const fontSize = Math.round(width * 0.055);
                    const rpFontSize = Math.round(width * 0.035);
                    
                    textSvg = \\\``;

content = content.replace(regex, replacement.replace(/\\\$/g, '$'));
fs.writeFileSync('src/services/whatsapp.ts', content);
