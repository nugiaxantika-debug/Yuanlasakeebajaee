const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
console.log(code.includes("this.ownerNumbers.has(senderJid)"));
console.log(code.includes("this.normalizeJid(senderJidRaw)"));
