const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace("caption: \\`✅ *Berhasil membuat \\${cmd}", "caption: `✅ *Berhasil membuat ${cmd}");

fs.writeFileSync('src/services/whatsapp.ts', text);
