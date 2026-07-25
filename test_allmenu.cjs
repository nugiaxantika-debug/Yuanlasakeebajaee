const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const idx = code.indexOf('│ .sulapmenu');
console.log(JSON.stringify(code.slice(idx, idx + 50)));
