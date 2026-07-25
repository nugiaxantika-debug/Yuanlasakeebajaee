const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
text = text.replace(/\\\`/g, '`');
text = text.replace(/\\\$/g, '$');
fs.writeFileSync('src/services/whatsapp.ts', text);
