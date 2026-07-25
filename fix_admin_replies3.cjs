const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: text, mentions: premiums \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: text }, { quoted: msg });"
);

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed replies for admin commands 3");
