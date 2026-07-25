const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const oldStr = '│ .sulapmenu\\nKetik menu yang kamu inginkan.';
const newStr = '│ .sulapmenu\\n│ .hentaimenu\\n│ .hantumenu\\nKetik menu yang kamu inginkan.';
code = code.split(oldStr).join(newStr);
fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
console.log('Replaced?', code.includes(newStr));
