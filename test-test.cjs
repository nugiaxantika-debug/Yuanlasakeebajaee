const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
const counts = code.split(`} } else if ((body.startsWith(".anime") || body.startsWith("anime")) && body !== ".animemenu" && body !== "animemenu") {`).length - 1;
console.log('Replacements:', counts);
