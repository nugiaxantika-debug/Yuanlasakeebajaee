const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /\} else if \(body\.startsWith\("\.meme"\) \|\| body\.startsWith\("meme"\)\) \{\n\s*await this\.sock\.sendMessage\(jid, \{ text: `🖼️ \*Meme\*\\n\\nFitur meme sedang dalam pengembangan\.` \}, \{ quoted: msg \}\);\n\s*\}/m;

const newLogic = `} else if (body.startsWith(".meme") || body.startsWith("meme")) {
        try {
            const axios = require('axios');
            const res = await axios.get("https://meme-api.com/gimme/indonesia");
            
            if (res.data && res.data.url) {
                await this.sock.sendMessage(jid, { 
                    image: { url: res.data.url }, 
                    caption: \\\`🖼️ *Meme*\\n\\n\\\${res.data.title || ''}\\\`
                }, { quoted: msg });
                this.broadcastState('Responded to meme command');
            } else {
                await this.sock.sendMessage(jid, { text: '❌ *Gagal mengambil meme.*' }, { quoted: msg });
            }
        } catch (e: any) {
            console.error("Meme error:", e);
            await this.sock.sendMessage(jid, { text: \\\`❌ *Gagal mengambil meme.*\\nDetail: \\\${e.message}\\\` }, { quoted: msg });
        }
    }`;

content = content.replace(regex, newLogic);
fs.writeFileSync('src/services/whatsapp.ts', content);
