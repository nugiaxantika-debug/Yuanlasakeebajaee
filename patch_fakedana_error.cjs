const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /catch \(e\) \{\n\s*console\.error\(e\);\n\s*await this\.sock\.sendMessage\(jid, \{ text: `❌ \*Gagal membuat gambar \$\{cmd\}\*` \}, \{ quoted: msg \}\);\n\s*\}/;

const newLogic = `catch (e: any) {
            console.error(e);
            await this.sock.sendMessage(jid, { text: \\\`❌ *Gagal membuat gambar \\\${cmd}*\\nDetail: \\\${e.message}\\\` }, { quoted: msg });
        }`;

content = content.replace(regex, newLogic);
fs.writeFileSync('src/services/whatsapp.ts', content);
