const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
  /│ \.hantumenu\n?│ \.postermenu\n*Ketik/,
  "│ .hantumenu\n│ .postermenu\n\nKetik"
);

fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
console.log("Updated allmenu string for postermenu with proper newlines!");
