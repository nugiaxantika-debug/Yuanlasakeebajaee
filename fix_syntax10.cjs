const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/caption: `✅ \*Berhasil membuat \\\\?\$\{cmd\} dengan nominal Rp \\\\?\$\{nominal\}\*\\\\?`/g, 'caption: `✅ *Berhasil membuat ${cmd} dengan nominal Rp ${nominal}*`');
fs.writeFileSync('src/services/whatsapp.ts', text);
