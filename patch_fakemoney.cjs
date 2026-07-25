const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const fakeMoneyLogic = `
    } else if (['.fakedana', 'fakedana', '.fakegopay', 'fakegopay', '.fakeseabank', 'fakeseabank', '.fakeovo', 'fakeovo', '.fakeshopeepay', 'fakeshopeepay', '.fakebrimo', 'fakebrimo', '.fakelivin', 'fakelivin'].includes(body.split(" ")[0].toLowerCase())) {
        const cmd = body.split(" ")[0].toLowerCase().replace('.', '');
        const nominal = body.split(" ").slice(1).join(" ");
        if (!nominal) {
            return await this.sock.sendMessage(jid, { text: \\\`⚠️ *Gunakan format:* .\\\${cmd} <nominal>\\nContoh: .\\\${cmd} 1.000.000\\\` }, { quoted: msg });
        }
        
        await this.sock.sendMessage(jid, { text: \\\`⏳ *Membuat fake saldo \\\${cmd} dengan nominal Rp \\\${nominal}...*\\\` }, { quoted: msg });
        
        try {
            const sharp = require('sharp');
            const svgText = \\\`
                <svg width="600" height="1200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="1200" fill="#118ee9"/>
                  <text x="50%" y="30%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">Fake \\\${cmd.replace('fake', '').toUpperCase()}</text>
                  <text x="50%" y="40%" font-family="Arial" font-size="80" fill="white" text-anchor="middle" font-weight="bold">Rp \\\${nominal}</text>
                  <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Silakan tambahkan foto template asli</text>
                  <text x="50%" y="55%" font-family="Arial" font-size="30" fill="white" text-anchor="middle">jika ingin hasil lebih realistis</text>
                </svg>
            \\\`;
            
            const buffer = await sharp(Buffer.from(svgText)).png().toBuffer();
            
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

content = content.replace('    } else if (body === "hewanmenu"', fakeMoneyLogic + '\n    } else if (body === "hewanmenu"');
fs.writeFileSync('src/services/whatsapp.ts', content);
