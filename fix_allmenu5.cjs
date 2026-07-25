const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(/│ \.sulapmenu\n\nKetik menu yang kamu inginkan\./, '│ .sulapmenu\n│ .hentaimenu\n│ .hantumenu\n\nKetik menu yang kamu inginkan.');
fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
console.log('Replaced?', code.includes('│ .hentaimenu\n│ .hantumenu'));
