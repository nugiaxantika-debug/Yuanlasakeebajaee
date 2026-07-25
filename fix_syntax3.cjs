const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// I will just rewrite the catch block to be absolutely safe
const safeText = text.replace(/catch \(e: any\) \{[\s\S]*?\}/, `catch (e: any) {
    console.error(e);
    await this.sock.sendMessage(jid, { text: "❌ *Gagal membuat gambar " + cmd + "*\\nDetail: " + e.message }, { quoted: msg });
}`);

fs.writeFileSync('src/services/whatsapp.ts', safeText);
