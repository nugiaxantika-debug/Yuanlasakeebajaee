const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
code = code.replace(`        if (cmd === "nanobananaai") systemPrompt = "You are NanoBanana AI, a highly advanced assistant.";`, "");
fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Removed nanobananaai text logic");
