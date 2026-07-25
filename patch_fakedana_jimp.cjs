const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /try \{\s*const templatePath = path\.join[\s\S]*?\} catch \(e: any\) \{\n\s*console\.error\(e\);\n\s*await this\.sock\.sendMessage\(jid, \{ text: `❌ \*Gagal membuat gambar \$\{cmd\}\*\\nDetail: \$\{e\.message\}` \}, \{ quoted: msg \}\);\n\s*\}/;

const newLogic = `try {
            const { Jimp, loadFont } = require('jimp');
            const fonts = require('jimp/fonts');
            const fs = require('fs');
            const path = require('path');
            
            const templatePath = path.join(process.cwd(), 'public', 'templates', cmd + '.png');
            let buffer;
            
            if (fs.existsSync(templatePath)) {
                const bg = await Jimp.read(templatePath);
                
                if (cmd === 'fakedana') {
                    const fontRp = await loadFont(fonts.SANS_32_WHITE);
                    const fontNominal = await loadFont(fonts.SANS_64_WHITE);
                    bg.print({ font: fontRp, x: 160, y: 195, text: "Rp" });
                    bg.print({ font: fontNominal, x: 220, y: 175, text: nominal });
                } else {
                    let isBlack = cmd === 'fakelivin';
                    const fontRp = await loadFont(isBlack ? fonts.SANS_32_BLACK : fonts.SANS_32_WHITE);
                    const fontNominal = await loadFont(isBlack ? fonts.SANS_64_BLACK : fonts.SANS_64_WHITE);
                    
                    bg.print({ font: fontRp, x: 100, y: 240, text: "Rp" });
                    bg.print({ font: fontNominal, x: 160, y: 220, text: nominal });
                }
                
                buffer = await bg.getBuffer('image/png');
            } else {
                const bg = new Jimp({ width: 600, height: 1200, color: '#118ee9' });
                const font = await loadFont(fonts.SANS_64_WHITE);
                const fontSmall = await loadFont(fonts.SANS_32_WHITE);
                
                bg.print({ font: fontSmall, x: 50, y: 300, text: "Fake " + cmd.replace('fake', '').toUpperCase() });
                bg.print({ font: font, x: 50, y: 400, text: "Rp " + nominal });
                bg.print({ font: fontSmall, x: 50, y: 500, text: "Template " + cmd + ".png tidak ditemukan!" });
                
                buffer = await bg.getBuffer('image/png');
            }
            
            await this.sock.sendMessage(jid, { 
                image: buffer, 
                caption: \\\`✅ *Berhasil membuat \\\${cmd} dengan nominal Rp \\\${nominal}*\\\` 
            }, { quoted: msg });
            this.broadcastState(\\\`Responded to \\\${cmd} command\\\`);
            
        } catch (e: any) {
            console.error(e);
            await this.sock.sendMessage(jid, { text: \\\`❌ *Gagal membuat gambar \\\${cmd}*\\nDetail: \\\${e.message}\\\` }, { quoted: msg });
        }`;

content = content.replace(regex, newLogic);
fs.writeFileSync('src/services/whatsapp.ts', content);
