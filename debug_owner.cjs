const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /private normalizeJid[\s\S]*?return numPart \+ "@s\.whatsapp\.net";\s*\}/;
const match = code.match(regex);
if (match) {
    console.log(match[0]);
} else {
    console.log("Not found");
}
