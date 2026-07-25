const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/caption: \\\\`✅/g, 'caption: `✅');
text = text.replace(/\\\\\\$\{cmd\}/g, '${cmd}');

fs.writeFileSync('src/services/whatsapp.ts', text);
