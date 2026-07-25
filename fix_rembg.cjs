const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// Ensure downloadMediaMessage is imported
if (!code.includes('downloadMediaMessage')) {
  code = code.replace(
    'import makeWASocket, {',
    'import makeWASocket, { downloadMediaMessage,'
  );
}

const target = `    } else if (body === "hapusbgfoto" || body === ".hapusbgfoto") {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;

      if (isQuotedImage || isImage) {
        await this.sock.sendMessage(jid, { text: "❌ *Layanan Hapus BG saat ini sedang down/maintenance dari server pihak ketiga.*\\nSilakan coba lagi nanti." }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: "⚠️ Kirim gambar dengan caption *.hapusbgfoto* atau balas gambar dengan *.hapusbgfoto*" }, { quoted: msg });
      }`;

const replacement = `    } else if (body === "hapusbgfoto" || body === ".hapusbgfoto") {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;

      if (isQuotedImage || isImage) {
        await this.sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
        try {
          const media = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            { 
              logger: this.sock.logger,
              reuploadRequest: this.sock.updateMediaMessage
            }
          );
          
          if (!media) {
             return await this.sock.sendMessage(jid, { text: "❌ *Gagal mengunduh gambar.*" }, { quoted: msg });
          }

          // Gunakan package lokal untuk background removal
          const { removeBackground } = require('@imgly/background-removal-node');
          const blob = new Blob([media], { type: 'image/jpeg' });
          const resultBlob = await removeBackground(blob);
          const buffer = Buffer.from(await resultBlob.arrayBuffer());

          await this.sock.sendMessage(jid, { image: buffer, caption: "🖼️ *Background berhasil dihapus!*" }, { quoted: msg });
          await this.sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        } catch (e) {
          console.error("Hapus BG error:", e);
          await this.sock.sendMessage(jid, { text: "❌ *Gagal menghapus background. Coba lagi.*" }, { quoted: msg });
          await this.sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
      } else {
        await this.sock.sendMessage(jid, { text: "⚠️ Kirim gambar dengan caption *.hapusbgfoto* atau balas gambar dengan *.hapusbgfoto*" }, { quoted: msg });
      }`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/services/whatsapp.ts', code);
   console.log("Updated hapusbgfoto successfully");
} else {
   console.log("Target not found");
}
