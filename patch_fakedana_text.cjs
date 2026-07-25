const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /if \(cmd === 'fakedana'\) \{[\s\S]*?\} else if \(cmd === 'fakegopay'\)/;
const replacement = `if (cmd === 'fakedana') {
                    // Dana: "Rp 14.841" biasanya di atas kiri pada aplikasi DANA terbaru
                    // X = 15%, Y = 7.5% untuk template umum screenshot
                    textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <text x="18%" y="7.5%" font-family="sans-serif" font-size="\\\${Math.round(width * 0.045)}" fill="white" font-weight="bold">Rp \\\${nominal}</text>
                        </svg>
                    \\\`;
                } else if (cmd === 'fakegopay')`;

content = content.replace(regex, replacement.replace(/\\\$/g, '$'));
fs.writeFileSync('src/services/whatsapp.ts', content);
