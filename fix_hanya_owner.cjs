const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
    /return await this\.sock\.sendMessage\(jid, \{ text: `⚠️ Hanya owner yang dapat menggunakan fitur ini!` \}, \{ quoted: msg \}\);/g,
    "return await this.sock.sendMessage(jid, { text: `⚠️ Hanya owner yang dapat menggunakan fitur ini!\\n(ID Anda: ${senderJid})` }, { quoted: msg });"
);

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed Hanya Owner");
