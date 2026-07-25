const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
  "│ .hantumenu\n│ .postermenu\n\nKetik",
  "│ .hantumenu\n│ .postermenu\n\nKetik"
);

// Checking what was replaced. Let's just output the whole section
const match = code.match(/│ \.hantumenu[\s\S]{0,100}Ketik/);
console.log(match ? match[0] : 'Not found');
