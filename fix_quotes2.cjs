const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/services/whatsapp.ts', 'utf8');

const regex = /return await this\.sock\.sendMessage\(jid, \{ text: "❌ \*Fitur hapusbgfoto dinonaktifkan\.\*[\s\S]*?REMOVEBG_API_KEY\`\." \}, \{ quoted: msg \}\);/;
code = code.replace(regex, 'return await this.sock.sendMessage(jid, { text: "❌ *Fitur hapusbgfoto dinonaktifkan.*\\n\\nKarena keterbatasan memori server (Railway), fitur ini membutuhkan *REMOVEBG_API_KEY*.\\n\\nCara mendapatkan:\\n1. Daftar di https://www.remove.bg/api\\n2. Dapatkan API Key gratis (50 foto/bulan)\\n3. Tambahkan di Environment Variables Railway sebagai `REMOVEBG_API_KEY`." }, { quoted: msg });');

fs.writeFileSync('/app/applet/src/services/whatsapp.ts', code);
