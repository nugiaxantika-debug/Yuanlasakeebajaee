const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const templateCmd = `
    } else if (body.startsWith(".settemplate") || body.startsWith("settemplate")) {
        const args = body.split(" ");
        if (args.length < 2) {
            return await this.sock.sendMessage(jid, { text: "⚠️ *Gunakan format:* .settemplate <namatemplate>\\nContoh: .settemplate fakedana\\n\\nKirim perintah ini dengan menyertakan/reply gambar." }, { quoted: msg });
        }
        const cmdName = args[1].toLowerCase().replace('.', '');
        
        try {
            let templateBuffer = null;
            let isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let isImage = msg.message?.imageMessage;
            
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
            
            if (templateBuffer) {
                const fs = require('fs');
                const path = require('path');
                const p = path.join(process.cwd(), 'public', 'templates', cmdName + '.png');
                fs.writeFileSync(p, templateBuffer);
                await this.sock.sendMessage(jid, { text: \\\`✅ *Berhasil menyimpan template untuk \\\${cmdName}*\\\` }, { quoted: msg });
            } else {
                await this.sock.sendMessage(jid, { text: "❌ *Gambar tidak ditemukan. Kirim gambar dengan caption .settemplate <nama> atau reply gambar.*" }, { quoted: msg });
            }
        } catch (e) {
            console.error(e);
            await this.sock.sendMessage(jid, { text: "❌ *Gagal menyimpan template.*" }, { quoted: msg });
        }
`;

const insertPos = content.indexOf('} else if ([\'.fakedana\', \'fakedana\'');
if (insertPos !== -1) {
    content = content.slice(0, insertPos) + templateCmd.trim() + '\n    ' + content.slice(insertPos);
    fs.writeFileSync('src/services/whatsapp.ts', content);
    console.log("Success adding .settemplate");
} else {
    console.log("Could not find insertion point for settemplate");
}
