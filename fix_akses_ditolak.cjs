const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
    /return await this\.sock\.sendMessage\(jid, \{ text: "👑 \*Akses Ditolak\*\\nPerintah ini hanya bisa digunakan oleh Owner!" \}, \{ quoted: msg \}\);/g,
    "return await this.sock.sendMessage(jid, { text: `👑 *Akses Ditolak*\\nPerintah ini hanya bisa digunakan oleh Owner!\\n\\n(Info Debug: ID Anda adalah ${senderJid})` }, { quoted: msg });"
);

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed Akses Ditolak");
