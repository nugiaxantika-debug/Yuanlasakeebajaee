const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace("│ .nanobananaai <teks>", "│ .nanobananaai <prompt>");

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Updated nanobananaai syntax");
