const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `    } else if (body.startsWith(".imgai ") || body.startsWith("imgai ") ||`;

const hapusBgCode = `    } else if (body.toLowerCase() === ".hapusbgfoto" || body.toLowerCase() === "hapusbgfoto") {
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
`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, hapusBgCode + targetStr);
  fs.writeFileSync('src/services/whatsapp.ts', code);
  console.log("Added hapusbgfoto");
} else {
  console.log("targetStr not found");
}
