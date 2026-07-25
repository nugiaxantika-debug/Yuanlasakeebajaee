const fs = require('fs');
const code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const startIdx = code.indexOf('else if (body === "hentaimenu"');
const endIdx = code.indexOf('else if ((body.startsWith(".anime")', startIdx);
console.log(code.substring(startIdx, endIdx));
