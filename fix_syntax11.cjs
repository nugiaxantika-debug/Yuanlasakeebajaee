const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/caption: `🖼️ \*Meme\*\\n\\n\$\{res\.data\.title \|\| ''\}`/g, "caption: `🖼️ *Meme*\\n\\n${res.data.title || ''}`");
text = text.replace(/caption: \\`🖼️ \*Meme\*\\n\\n\\\$\{res\.data\.title \|\| ''\}\\\`/g, "caption: `🖼️ *Meme*\\n\\n${res.data.title || ''}`");

// A brute-force regex for escaping:
text = text.replace(/\\`/g, '`').replace(/\\\$/g, '$');

fs.writeFileSync('src/services/whatsapp.ts', text);
