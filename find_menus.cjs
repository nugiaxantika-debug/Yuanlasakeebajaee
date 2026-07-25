const fs = require('fs');
const code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

console.log("Found sulapCommands:", code.includes("const sulapCommands ="));
console.log("Found hentaiCommands:", code.includes("const hentaiCommands ="));
console.log("Found hantuCommands:", code.includes("const hantuCommands ="));
