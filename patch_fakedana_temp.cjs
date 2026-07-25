const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /buffer = await bg\.getBuffer\('image\/png'\);\n\s*\}\n\s*await this\.sock\.sendMessage\(jid, \{\s*image: Buffer\.from\(buffer\),\s*mimetype: 'image\/png',\s*caption: `✅ \*Berhasil membuat \$\{cmd\} dengan nominal Rp \$\{nominal\}\*`\s*\}, \{ quoted: msg \}\);\n\s*this\.broadcastState\(`Responded to \$\{cmd\} command`\);/m;

const replacement = `buffer = await bg.getBuffer('image/png');
            }
            
            const tempPath = path.join(process.cwd(), 'public', 'templates', 'temp_' + Date.now() + '_' + cmd + '.png');
            fs.writeFileSync(tempPath, Buffer.from(buffer));
            
            await this.sock.sendMessage(jid, { 
                image: { url: tempPath },
                caption: \\\`✅ *Berhasil membuat \\\${cmd} dengan nominal Rp \\\${nominal}*\\\` 
            }, { quoted: msg });
            
            fs.unlinkSync(tempPath);
            this.broadcastState(\\\`Responded to \\\${cmd} command\\\`);`;

text = text.replace(regex, replacement);

fs.writeFileSync('src/services/whatsapp.ts', text);
