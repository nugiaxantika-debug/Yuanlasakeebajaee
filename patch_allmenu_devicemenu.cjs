const fs = require('fs');
const file = 'src/services/whatsapp.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "│ .toolsmenu\n\nKetik menu",
  "│ .toolsmenu\n│ .devicemenu\n\nKetik menu"
);

fs.writeFileSync(file, code);
console.log('patched allmenu');
