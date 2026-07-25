const fs = require('fs');
const code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const searchRegex = /else if.*hentai/g;
let match;
while ((match = searchRegex.exec(code)) !== null) {
  console.log(match[0]);
}

const searchRegex2 = /else if.*hantu/g;
while ((match = searchRegex2.exec(code)) !== null) {
  console.log(match[0]);
}
