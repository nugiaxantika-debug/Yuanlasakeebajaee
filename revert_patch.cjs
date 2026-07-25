const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/image: Buffer\.from\(buffer\),\n                mimetype: "image\/png",/g, 'image: buffer,');

fs.writeFileSync('src/services/whatsapp.ts', text);
