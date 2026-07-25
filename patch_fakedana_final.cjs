const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const oldRegex = /\} else if \(\['\.fakedana', 'fakedana',.*?catch \(e\) \{\n\s*console\.error\(e\);\n\s*await this\.sock\.sendMessage\(jid, \{ text: `❌ \*Gagal membuat gambar \$\{cmd\}\*` \}, \{ quoted: msg \}\);\n\s*\}\n/s;

const newLogic = `
    } else if (['.fakedana', 'fakedana', '.fakegopay', 'fakegopay', '.fakeseabank', 'fakeseabank', '.fakeovo', 'fakeovo', '.fakeshopeepay', 'fakeshopeepay', '.fakebrimo', 'fakebrimo', '.fakelivin', 'fakelivin'].includes(body.split(" ")[0].toLowerCase())) {
        const cmd = body.split(" ")[0].toLowerCase().replace('.', '');
        const nominal = body.split(" ").slice(1).join(" ");
        if (!nominal) {
            return await this.sock.sendMessage(jid, { text: \\\`⚠️ *Gunakan format:* .\\\${cmd} <nominal>\\nContoh: .\\\${cmd} 1.000.000\\n\\n(Kirim gambar screenshot DANA dengan caption perintah, atau reply gambar untuk menggunakan foto tsb)\\\` }, { quoted: msg });
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
            
            let buffer;
            if (templateBuffer) {
                // User mengirim screenshot asli!
                const metadata = await sharp(templateBuffer).metadata();
                const width = metadata.width || 1080;
                const height = metadata.height || 1920;
                
                let textSvg = '';
                
                if (cmd === 'fakedana') {
                    // DANA: Nominal ada di atas kiri.
                    // Background DANA blue: #108ee9
                    // Koordinat kira-kira untuk menutupi "Rp 14.841"
                    const boxX = Math.round(width * 0.10);
                    const boxY = Math.round(height * 0.02);
                    const boxW = Math.round(width * 0.50);
                    const boxH = Math.round(height * 0.05);
                    const fontSize = Math.round(width * 0.06);
                    const rpFontSize = Math.round(width * 0.035);
                    
                    textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <!-- Tutupi saldo lama dengan warna biru DANA -->
                            <rect x="\\\${boxX}" y="\\\${boxY}" width="\\\${boxW}" height="\\\${boxH}" fill="#118EE9" />
                            <!-- Teks baru -->
                            <text x="\\\${boxX + (width * 0.02)}" y="\\\${boxY + (boxH * 0.7)}" font-family="sans-serif" font-size="\\\${rpFontSize}" fill="white" font-weight="normal">Rp</text>
                            <text x="\\\${boxX + (width * 0.08)}" y="\\\${boxY + (boxH * 0.7)}" font-family="sans-serif" font-size="\\\${fontSize}" fill="white" font-weight="bold">\\\${nominal}</text>
                        </svg>
                    \\\`;
                } else {
                    // Default fallback for others using user screenshot
                    const boxX = Math.round(width * 0.10);
                    const boxY = Math.round(height * 0.10);
                    const boxW = Math.round(width * 0.80);
                    const boxH = Math.round(height * 0.10);
                    const fontSize = Math.round(width * 0.07);
                    textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <rect x="\\\${boxX}" y="\\\${boxY}" width="\\\${boxW}" height="\\\${boxH}" fill="#333333" />
                            <text x="\\\${width / 2}" y="\\\${boxY + (boxH * 0.7)}" font-family="sans-serif" font-size="\\\${fontSize}" fill="white" text-anchor="middle" font-weight="bold">Rp \\\${nominal}</text>
                        </svg>
                    \\\`;
                }
                
                buffer = await sharp(templateBuffer)
                    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
                    .png()
                    .toBuffer();
                    
            } else {
                // Fallback jika user tidak mengirim gambar
                // Coba gunakan template dari server
                const templatePath = path.join(process.cwd(), 'public', 'templates', cmd + '.png');
                if (fs.existsSync(templatePath)) {
                    const metadata = await sharp(templatePath).metadata();
                    const width = metadata.width || 1080;
                    const height = metadata.height || 1920;
                    
                    let textColor = 'white';
                    if (cmd === 'fakelivin') textColor = 'black';
                    
                    let textSvg = \\\`
                        <svg width="\\\${width}" height="\\\${height}" xmlns="http://www.w3.org/2000/svg">
                            <text x="100" y="240" font-family="sans-serif" font-size="40" fill="\\\${textColor}">Rp</text>
                            <text x="160" y="240" font-family="sans-serif" font-size="70" fill="\\\${textColor}" font-weight="bold">\\\${nominal}</text>
                        </svg>
                    \\\`;
                    
                    buffer = await sharp(templatePath)
                        .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
                        .png()
                        .toBuffer();
                } else {
                    const svgText = \\\`
                        <svg width="600" height="1200" xmlns="http://www.w3.org/2000/svg">
                          <rect width="600" height="1200" fill="#118ee9"/>
                          <text x="50%" y="30%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">Fake \\\${cmd.replace('fake', '').toUpperCase()}</text>
                          <text x="50%" y="40%" font-family="Arial" font-size="80" fill="white" text-anchor="middle" font-weight="bold">Rp \\\${nominal}</text>
                          <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Silakan kirim/reply foto screenshot asli</text>
                        </svg>
                    \\\`;
                    buffer = await sharp(Buffer.from(svgText)).png().toBuffer();
                }
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

content = content.replace(oldRegex, newLogic.trim() + '\n');
fs.writeFileSync('src/services/whatsapp.ts', content);
