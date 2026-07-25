const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `│ .rpgmenu\\n│ .storemenu\\n│ .beritamenu\\n│ .sulapmenu\\nKetik menu yang kamu inginkan.`;
const replStr = `│ .rpgmenu\\n│ .storemenu\\n│ .beritamenu\\n│ .sulapmenu\\n│ .hentaimenu\\n│ .hantumenu\\nKetik menu yang kamu inginkan.`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replStr);
  fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
  console.log('Fixed allmenu!');
} else {
  console.log('Target not found!');
}
