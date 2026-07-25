const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const target = `            await this.sock.sendMessage(jid, { 
                image: buffer, 
                caption: \\\`✅ *Berhasil membuat \\\${cmd} dengan nominal Rp \\\${nominal}*\\\` 
            }, { quoted: msg });`;

const replacement = `            await this.sock.sendMessage(jid, { 
                image: Buffer.from(buffer), 
                mimetype: 'image/png',
                caption: \\\`✅ *Berhasil membuat \\\${cmd} dengan nominal Rp \\\${nominal}*\\\` 
            }, { quoted: msg });`;

text = text.replace(target, replacement);

fs.writeFileSync('src/services/whatsapp.ts', text);
