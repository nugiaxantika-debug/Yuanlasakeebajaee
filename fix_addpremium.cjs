const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

let match = code.match(/✨ \*Add Premium\*/);
if (match) {
    code = code.replace(
        /await this\.sock\.sendMessage\(jid, \{ text: \`✨ \*Add Premium\*\n\nBerhasil menambahkan @\$\{targetJid\.split\('@'\)\[0\]\} ke daftar premium!\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
        "await this.sock.sendMessage(jid, { text: `✨ *Add Premium*\\n\\nBerhasil menambahkan ${targetJid.split('@')[0]} ke daftar premium!` }, { quoted: msg });"
    );
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Fixed addpremium");
} else {
    console.log("Not found");
}
