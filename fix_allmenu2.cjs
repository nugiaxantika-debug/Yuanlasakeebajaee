const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(/│ \.sulapmenu\\nKetik menu yang kamu inginkan\./g, '│ .sulapmenu\\n│ .hentaimenu\\n│ .hantumenu\\nKetik menu yang kamu inginkan.');
fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
console.log('Done!');
