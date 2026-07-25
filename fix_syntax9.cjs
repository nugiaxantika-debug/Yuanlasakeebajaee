const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
text = text.replace(/this\.broadcastState\(`Responded to  command`\);/g, 'this.broadcastState(`Responded to ${cmd} command`);');
text = text.replace(/text: `❌ \*Gagal membuat gambar \$\{cmd\}\*\\nDetail: \$\{e\.message\}` \}, \{ quoted: msg \}\);/g, 'text: `❌ *Gagal membuat gambar ${cmd}*\\nDetail: ${e.message}` }, { quoted: msg });');
fs.writeFileSync('src/services/whatsapp.ts', text);
