const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/caption: \\\\`✅/g, 'caption: `✅');
text = text.replace(/Rp \\\\\\\$\{nominal\}\\\\`/g, 'Rp ${nominal}`');
text = text.replace(/this\.broadcastState\(\\\\\`Responded to \\\\\\\$\{cmd\} command\\\\\`\);/g, 'this.broadcastState(`Responded to ${cmd} command`);');
text = text.replace(/text: \\\\`❌/g, 'text: `❌');
text = text.replace(/\\\\\\\$\{e\.message\}\\\\`/g, '${e.message}`');
// Alternatively just replace all `\\`` with '`'
text = text.replace(/\\\`/g, '`');
text = text.replace(/\\\$/g, '$');

fs.writeFileSync('src/services/whatsapp.ts', text);
