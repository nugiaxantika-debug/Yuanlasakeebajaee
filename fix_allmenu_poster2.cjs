const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
  "│ .hantumenu\n\nKetik menu yang kamu inginkan.",
  "│ .hantumenu\n│ .postermenu\n\nKetik menu yang kamu inginkan."
);

fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
console.log("Updated allmenu string for postermenu!");
