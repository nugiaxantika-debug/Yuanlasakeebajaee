const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/image: buffer,/g, 'image: Buffer.from(buffer),\n                mimetype: "image/png",');

fs.writeFileSync('src/services/whatsapp.ts', text);
