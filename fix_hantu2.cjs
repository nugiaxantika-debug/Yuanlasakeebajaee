const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /if \(queries\[q\]\) \{\n\s*await this\.sock\.sendMessage\(jid, \{ text: `⏳ \*Memanggil \$\{q\}\.\.\.\*` \}, \{ quoted: msg \}\);\n\s*try \{[\s\S]*?\}\n\s*\}/;

const newLogic = `if (queries[q]) {
        await this.sock.sendMessage(jid, { text: \`⏳ *Memanggil \${q}...*\` }, { quoted: msg });
        const staticHantu: Record<string, string> = {
          "pocong": "https://i.pinimg.com/originals/98/d7/98/98d79852b910b2b9461dd75096ffe4e1.jpg",
          "kuntilanak": "https://i.pinimg.com/originals/e7/8a/cc/e78acc29b165b6a7b75ec177b9666d95.jpg",
          "genderuwo": "https://i.pinimg.com/736x/88/54/1b/88541be5e63842c38d3845b41040ed53.jpg",
          "wewegombel": "https://i.pinimg.com/originals/61/9b/6c/619b6c0da662409c768ac2480c7f8549.png",
          "tuyul": "https://i.pinimg.com/originals/f3/e6/78/f3e6789b70b329431c2605eb80352ff6.jpg",
          "sundelbolong": "https://i.pinimg.com/originals/ce/e3/e2/cee3e2261da2a51f893693f9de78aebf.jpg",
          "palasik": "https://i.pinimg.com/736x/82/81/25/828125cf36c94cfd8591ef14092b7754.jpg",
          "kuyang": "https://i.pinimg.com/736x/f6/88/2c/f6882c7d9e8eb3f309a633dfb1de6cc3.jpg",
          "banaspati": "https://i.pinimg.com/736x/9f/51/77/9f517743d5cde78ff9d33261a868f00f.jpg",
          "jelangkung": "https://i.pinimg.com/736x/fc/55/e5/fc55e59279dc6e8cc8de9708985ef4ed.jpg",
          "siluman": "https://i.pinimg.com/736x/91/97/fb/9197fb94b7c6c40a3ddb4a0ca06d9d06.jpg",
          "nyirorokidul": "https://i.pinimg.com/736x/9f/7a/74/9f7a744234c9c228d447d21fc98beff5.jpg",
          "gundulpringis": "https://i.pinimg.com/736x/cc/e9/8a/cce98ad970634ed1f2596ab293675005.jpg"
        };
        const img = staticHantu[q];
        if (img) {
            await this.sock.sendMessage(jid, { image: { url: img }, caption: \`👻 *Penampakan \${q.charAt(0).toUpperCase() + q.slice(1)}*\` }, { quoted: msg });
        } else {
            await this.sock.sendMessage(jid, { text: \`❌ *\${q} sedang tidak menampakkan diri.*\` }, { quoted: msg });
        }
      }`;

code = code.replace(regex, newLogic);
fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
console.log('Hantu updated?', code.includes('staticHantu'));
