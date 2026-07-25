const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/caption: \\\\`✅/g, 'caption: `✅');
text = text.replace(/\\\\\\$\{nominal\}\\\\\`/g, '${nominal}`');
text = text.replace(/this\.broadcastState\(\\\\\`Responded to \\\\\\\$\{cmd\} command\\\\\`\);/g, 'this.broadcastState(`Responded to ${cmd} command`);');
// More simply, let's just do:
text = text.replace(/caption: \\`✅/g, 'caption: `✅');
text = text.replace(/\\$\{nominal\}\\`/g, '${nominal}`');
text = text.replace(/this\.broadcastState\(\\`Responded to \\$\{cmd\} command\\`\);/g, 'this.broadcastState(`Responded to ${cmd} command`);');

fs.writeFileSync('src/services/whatsapp.ts', text);
