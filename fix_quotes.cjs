const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/services/whatsapp.ts', 'utf8');

code = code.replace(
    'return await this.sock.sendMessage(jid, { text: "❌ *Fitur hapusbgfoto dinonaktifkan.*\\nKarena keterbatasan memori server (Railway), fitur ini membutuhkan *REMOVEBG_API_KEY*.\\nCara mendapatkan:\\n1. Daftar di https://www.remove.bg/api\\n2. Dapatkan API Key gratis (50 foto/bulan)\\n3. Tambahkan di Environment Variables Railway sebagai `REMOVEBG_API_KEY`." }, { quoted: msg });',
    'return await this.sock.sendMessage(jid, { text: "❌ *Fitur hapusbgfoto dinonaktifkan.*\\n\\nKarena keterbatasan memori server (Railway), fitur ini membutuhkan *REMOVEBG_API_KEY*.\\n\\nCara mendapatkan:\\n1. Daftar di https://www.remove.bg/api\\n2. Dapatkan API Key gratis (50 foto/bulan)\\n3. Tambahkan di Environment Variables Railway sebagai `REMOVEBG_API_KEY`." }, { quoted: msg });'
);

// Since it's multiline in the code now, we should replace the exact multiline text.
