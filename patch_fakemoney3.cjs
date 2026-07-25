const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const newLogic = `
    } else if (['.fakedana', 'fakedana', '.fakegopay', 'fakegopay', '.fakeseabank', 'fakeseabank', '.fakeovo', 'fakeovo', '.fakeshopeepay', 'fakeshopeepay', '.fakebrimo', 'fakebrimo', '.fakelivin', 'fakelivin'].includes(body.split(" ")[0].toLowerCase())) {
        const cmd = body.split(" ")[0].toLowerCase().replace('.', '');
        const nominal = body.split(" ").slice(1).join(" ");
        if (!nominal) {
            return await this.sock.sendMessage(jid, { text: \\\`⚠️ *Gunakan format:* .\\\${cmd} <nominal>\\nContoh: .\\\${cmd} 1.000.000\\n\\n(Kirim gambar dengan caption perintah, atau reply gambar untuk menggunakan custom template)\\\` }, { quoted: msg });
        }
        
        await this.sock.sendMessage(jid, { text: \\\`⏳ *Membuat fake saldo \\\${cmd} dengan nominal Rp \\\${nominal}...*\\\` }, { quoted: msg });
        
        try {
            const sharp = require('sharp');
            const fs = require('fs');
            const path = require('path');
            
            let templateBuffer = null;
            let isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let isImage = msg.message?.imageMessage;
            
            try {
                if (isImage) {
                    templateBuffer = await downloadMediaMessage(
                        { message: { imageMessage: isImage }, key: msg.key } as any,
                        'buffer', {}, { logger: this.sock.logger as any, reuploadRequest: this.sock.updateMediaMessage }
                    ) as Buffer;
                } else if (isQuotedImage) {
                    templateBuffer = await downloadMediaMessage(
                        { message: { imageMessage: isQuotedImage } } as any,
                        'buffer', {}, { logger: this.sock.logger as any, reuploadRequest: this.sock.updateMediaMessage }
                    ) as Buffer;
                }
            } catch (e) {
                console.error("Gagal download gambar dari user", e);
            }
            
            if (!templateBuffer) {
                // Cek apakah ada template lokal
                const extensions = ['.png', '.jpg', '.jpeg'];
                let templatePath = null;
                for (const ext of extensions) {
                    const p = path.join(process.cwd(), 'public', 'templates', cmd + ext);
                    if (fs.existsSync(p)) {
                        templatePath = p;
                        break;
                    }
                }
                if (templatePath) {
                    templateBuffer = fs.readFileSync(templatePath);
                }
            }
            
            let buffer;
            if (templateBuffer) {
                // Gunakan template asli / custom
                const metadata = await sharp(templateBuffer).metadata();
                const width = metadata.width || 1080;
                const height = metadata.height || 1920;
                
                // Konfigurasi posisi teks (default di tengah, bisa disesuaikan per aplikasi)
                let textSvg = '';
                if (cmd === 'fakedana') {
                    // Dana: "Rp 14.841" di user image (di bagian atas)
                    // Biasanya user menggunakan screenshot langsung.
                    // X = 15%, Y = 8%
                    textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <text x="18%" y="7.5%" font-family="sans-serif" font-size="\\\${Math.round(width * 0.045)}" fill="white" font-weight="bold">Rp \\\${nominal}</text>
                        </svg>
                    \\\`;
                } else if (cmd === 'fakegopay') {
                    textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <text x="15%" y="15%" font-family="sans-serif" font-size="\\\${Math.round(width * 0.05)}" fill="white" font-weight="bold">Rp\\\${nominal}</text>
                        </svg>
                    \\\`;
                } else {
                    // Default fallback for others
                    textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <text x="50%" y="20%" font-family="sans-serif" font-size="\\\${Math.round(width * 0.06)}" fill="black" text-anchor="middle" font-weight="bold">Rp \\\${nominal}</text>
                        </svg>
                    \\\`;
                }
                
                buffer = await sharp(templateBuffer)
                    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
                    .png()
                    .toBuffer();
            } else {
                // Fallback jika tidak ada template sama sekali
                const svgText = \\\`
                    <svg width="600" height="1200" xmlns="http://www.w3.org/2000/svg">
                      <rect width="600" height="1200" fill="#118ee9"/>
                      <text x="50%" y="30%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">Fake \\\${cmd.replace('fake', '').toUpperCase()}</text>
                      <text x="50%" y="40%" font-family="Arial" font-size="80" fill="white" text-anchor="middle" font-weight="bold">Rp \\\${nominal}</text>
                      <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Template \\\${cmd}.png tidak ditemukan!</text>
                      <text x="50%" y="55%" font-family="Arial" font-size="30" fill="white" text-anchor="middle">Silakan reply/kirim gambar sebagai template</text>
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

const oldLogicRegex = /\} else if \(\['\.fakedana', 'fakedana',.*?catch \(e\) \{\n\s*console\.error\(e\);\n\s*await this\.sock\.sendMessage\(jid, \{ text: `❌ \*Gagal membuat gambar \$\{cmd\}\*` \}, \{ quoted: msg \}\);\n\s*\}\n/s;
content = content.replace(oldLogicRegex, newLogic.trim() + '\n');
fs.writeFileSync('src/services/whatsapp.ts', content);
