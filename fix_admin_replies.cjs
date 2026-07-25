const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: \`✨ \*Add Premium\*\n\nBerhasil menambahkan @\$\{targetJid\.split\('@'\)\[0\]\} ke daftar premium!\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: `✨ *Add Premium*\\n\\nBerhasil menambahkan ${targetJid.split('@')[0]} ke daftar premium!` }, { quoted: msg });"
);

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: \`✅ Berhasil menambahkan @\$\{targetJid\.split\('@'\)\[0\]\} sebagai owner baru!\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: `✅ Berhasil menambahkan ${targetJid.split('@')[0]} sebagai owner baru!` }, { quoted: msg });"
);

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: \`✅ Berhasil menghapus @\$\{targetJid\.split\('@'\)\[0\]\} dari daftar owner!\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus ${targetJid.split('@')[0]} dari daftar owner!` }, { quoted: msg });"
);

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: \`⚠️ User @\$\{targetJid\.split\('@'\)\[0\]\} bukan owner\.\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: `⚠️ User ${targetJid.split('@')[0]} bukan owner.` }, { quoted: msg });"
);

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: \`✅ Berhasil menghapus @\$\{targetJid\.split\('@'\)\[0\]\} dari daftar premium!\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus ${targetJid.split('@')[0]} dari daftar premium!` }, { quoted: msg });"
);

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: \`⚠️ User @\$\{targetJid\.split\('@'\)\[0\]\} bukan premium\.\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: `⚠️ User ${targetJid.split('@')[0]} bukan premium.` }, { quoted: msg });"
);

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed replies for admin commands");
