const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /await this\.sock\.sendMessage\(jid, \{\s*image: buffer,\s*caption: `✅ \*Berhasil membuat \$\{cmd\}/g;

text = text.replace(regex, `await this.sock.sendMessage(jid, { 
                image: Buffer.from(buffer), 
                mimetype: 'image/png',
                caption: \\\`✅ *Berhasil membuat \\\${cmd}`);

fs.writeFileSync('src/services/whatsapp.ts', text);
