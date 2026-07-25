const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
text = text.replace(/text: \\\\`❌/g, 'text: `❌');
text = text.replace(/e\.message\\\\`/g, 'e.message`');
text = text.replace(/\\nDetail:/g, '\\nDetail:');
fs.writeFileSync('src/services/whatsapp.ts', text);
