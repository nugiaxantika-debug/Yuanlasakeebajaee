const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const target = `    } else if (body.toLowerCase().startsWith(".hapusbgfoto") || body.toLowerCase().startsWith("hapusbgfoto")) {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;
      
      if (!isImage && !isQuotedImage) {
         return await this.sock.sendMessage(jid, { text: "⚠️ Kirim gambar dengan caption .hapusbgfoto atau balas gambar dengan .hapusbgfoto" }, { quoted: msg });
      }
      
      await this.sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
      
      try {
         // Placeholder for removebg API since external ones are down or require keys
         // Informing the user gracefully
         await this.sock.sendMessage(jid, { text: "❌ *Layanan Hapus BG saat ini sedang down/maintenance dari server pihak ketiga.*\\nSilakan coba lagi nanti." }, { quoted: msg });
         await this.sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
      } catch (e) {
         console.error("hapusbgfoto err:", e);
         await this.sock.sendMessage(jid, { text: "❌ Gagal memproses gambar." }, { quoted: msg });
      }
    }`;

const replacement = `    } else if (body.toLowerCase().startsWith(".hapusbgfoto") || body.toLowerCase().startsWith("hapusbgfoto")) {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;
      
      if (!isImage && !isQuotedImage) {
         return await this.sock.sendMessage(jid, { text: "⚠️ Kirim gambar dengan caption .hapusbgfoto atau balas gambar dengan .hapusbgfoto" }, { quoted: msg });
      }
      
      await this.sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
      
      try {
          const pseudoMsg = isQuotedImage ? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage : msg.message;
          const media = await downloadMediaMessage(
            { message: pseudoMsg, key: msg.key } as any,
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

          // Use the background removal node module
          const { removeBackground } = require('@imgly/background-removal-node');
          const blob = new Blob([media], { type: 'image/jpeg' });
          const resultBlob = await removeBackground(blob);
          const buffer = Buffer.from(await resultBlob.arrayBuffer());

          await this.sock.sendMessage(jid, { image: buffer, caption: "🖼️ *Background berhasil dihapus!*" }, { quoted: msg });
          await this.sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
      } catch (e) {
         console.error("hapusbgfoto err:", e);
         await this.sock.sendMessage(jid, { text: "❌ *Gagal memproses gambar atau server sedang sibuk (sedang mengunduh model AI).* Coba lagi dalam 1 menit." }, { quoted: msg });
         await this.sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
      }
    }`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/services/whatsapp.ts', code);
   console.log("Updated hapusbgfoto successfully");
} else {
   console.log("Target not found");
}
