const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: \`✨ \*Add Premium\*\n\nBerhasil menambahkan @\$\{targetJid\.split\('@'\)\[0\]\} ke daftar premium!\`, mentions: \[targetJid\] \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: `✨ *Add Premium*\\n\\nBerhasil menambahkan ${targetJid.split('@')[0]} ke daftar premium!` }, { quoted: msg });"
);

// We'll also check if we missed listowner mentions
code = code.replace(
    /text \+\= \`\$\{idx \+ 1\}\. @\$\{owner\.split\('@'\)\[0\]\}\\n\`;/g,
    "text += `${idx + 1}. ${owner.split('@')[0]}\\n`;"
);

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: text, mentions: owners \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: text }, { quoted: msg });"
);

code = code.replace(
    /text \+\= \`\$\{idx \+ 1\}\. @\$\{prem\.split\('@'\)\[0\]\}\\n\`;/g,
    "text += `${idx + 1}. ${prem.split('@')[0]}\\n`;"
);

code = code.replace(
    /await this\.sock\.sendMessage\(jid, \{ text: text, mentions: prems \}, \{ quoted: msg \}\);/g,
    "await this.sock.sendMessage(jid, { text: text }, { quoted: msg });"
);


fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed replies for admin commands 2");
