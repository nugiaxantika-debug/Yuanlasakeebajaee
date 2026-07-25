const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `    } else if (body.toLowerCase() === ".hapusbgfoto" || body.toLowerCase() === "hapusbgfoto") {`;
const replacement = `    } else if (body.toLowerCase().startsWith(".hapusbgfoto") || body.toLowerCase().startsWith("hapusbgfoto")) {`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/services/whatsapp.ts', code);
  console.log("Fixed hapusbgfoto startsWith");
} else {
  console.log("targetStr not found");
}
