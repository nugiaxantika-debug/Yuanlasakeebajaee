const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /let textSvg = \`[\s\S]*?\} else if \(cmd === 'fakegopay'\)/;
const replacement = `let textSvg = '';
                
                if (cmd === 'fakedana') {
                    // Dana: "Rp 14.841" di user image. 
                    // Kita akan menutupi teks lama dengan kotak biru (#118EE9) lalu menulis teks baru.
                    // Posisi kira-kira: X=17%, Y=4%, Width=40%, Height=6%
                    const boxX = Math.round(width * 0.16);
                    const boxY = Math.round(height * 0.04);
                    const boxW = Math.round(width * 0.40);
                    const boxH = Math.round(height * 0.05);
                    const fontSize = Math.round(width * 0.055);
                    
                    textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <!-- Tutupi saldo lama -->
                            <rect x="\\\${boxX}" y="\\\${boxY}" width="\\\${boxW}" height="\\\${boxH}" fill="#108ee9" />
                            <!-- Teks baru -->
                            <text x="\\\${boxX + 10}" y="\\\${boxY + boxH * 0.75}" font-family="sans-serif" font-size="\\\${fontSize}" fill="white" font-weight="bold">\\\${nominal}</text>
                        </svg>
                    \\\`;
                } else if (cmd === 'fakegopay')`;

content = content.replace(regex, replacement.replace(/\\\$/g, '$'));
fs.writeFileSync('src/services/whatsapp.ts', content);
