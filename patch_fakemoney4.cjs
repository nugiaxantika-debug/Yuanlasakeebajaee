const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /\} else if \(\['\.fakedana', 'fakedana',.*?catch \(e\) \{\n\s*console\.error\(e\);\n\s*await this\.sock\.sendMessage\(jid, \{ text: `❌ \*Gagal membuat gambar \$\{cmd\}\*` \}, \{ quoted: msg \}\);\n\s*\}\n/s;

const newLogic = `
    } else if (['.fakedana', 'fakedana', '.fakegopay', 'fakegopay', '.fakeseabank', 'fakeseabank', '.fakeovo', 'fakeovo', '.fakeshopeepay', 'fakeshopeepay', '.fakebrimo', 'fakebrimo', '.fakelivin', 'fakelivin'].includes(body.split(" ")[0].toLowerCase())) {
        const cmd = body.split(" ")[0].toLowerCase().replace('.', '');
        const nominal = body.split(" ").slice(1).join(" ");
        if (!nominal) {
            return await this.sock.sendMessage(jid, { text: \\\`⚠️ *Gunakan format:* .\\\${cmd} <nominal>\\nContoh: .\\\${cmd} 1.000.000\\\` }, { quoted: msg });
        }
        
        await this.sock.sendMessage(jid, { text: \\\`⏳ *Membuat fake saldo \\\${cmd} dengan nominal Rp \\\${nominal}...*\\\` }, { quoted: msg });
        
        try {
            const sharp = require('sharp');
            const fs = require('fs');
            const path = require('path');
            
            // Menggunakan template yang sudah digenerate dari server (public/templates/cmd.png)
            const templatePath = path.join(process.cwd(), 'public', 'templates', cmd + '.png');
            let buffer;
            
            if (fs.existsSync(templatePath)) {
                const metadata = await sharp(templatePath).metadata();
                const width = metadata.width || 1080;
                const height = metadata.height || 1920;
                
                // SVG untuk menimpa text saldo
                let textColor = 'white';
                if (cmd === 'fakelivin') textColor = 'black';
                
                let textSvg = \\\`
                    <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                        <!-- Tulisan Rp kecil -->
                        <text x="100" y="240" font-family="sans-serif" font-size="40" fill="\\\${textColor}">Rp</text>
                        <!-- Nominal besar di sebelah Rp -->
                        <text x="160" y="240" font-family="sans-serif" font-size="70" fill="\\\${textColor}" font-weight="bold">\\\${nominal}</text>
                    </svg>
                \\\`;
                
                buffer = await sharp(templatePath)
                    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
                    .png()
                    .toBuffer();
            } else {
                // Fallback jika tidak ada template
                const svgText = \\\`
                    <svg width="600" height="1200" xmlns="http://www.w3.org/2000/svg">
                      <rect width="600" height="1200" fill="#118ee9"/>
                      <text x="50%" y="30%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">Fake \\\${cmd.replace('fake', '').toUpperCase()}</text>
                      <text x="50%" y="40%" font-family="Arial" font-size="80" fill="white" text-anchor="middle" font-weight="bold">Rp \\\${nominal}</text>
                      <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Template \\\${cmd}.png tidak ditemukan!</text>
                    </svg>
                \\\`;
                buffer = await sharp(Buffer.from(svgText)).png().toBuffer();
            }
            
            await this.sock.sendMessage(jid, { 
                image: buffer, 
                caption: \\\`✅ *Berhasil membuat \\\${cmd} dengan nominal Rp \\\${nominal}*\\\` 
            }, { quoted: msg });
            this.broadcastState(\\\`Responded to \\\${cmd} command\\\`);
            
        } catch (e) {
            console.error(e);
            await this.sock.sendMessage(jid, { text: \\\`❌ *Gagal membuat gambar \\\${cmd}*\\\` }, { quoted: msg });
        }
`;

content = content.replace(regex, newLogic.trim() + '\n');
fs.writeFileSync('src/services/whatsapp.ts', content);
