const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `                  model: "gemini-2.0-flash",`;
const replacement = `                  model: "gemini-flash-latest",`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed model!");
