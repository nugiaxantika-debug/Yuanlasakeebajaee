const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /        const staticHantu: Record<string, string> = \{\n[\s\S]*?\};\n        const img = staticHantu\[q\];\n        if \(img\) \{\n            await this\.sock\.sendMessage\(jid, \{ image: \{ url: img \}, caption: `👻 \*Penampakan \$\{q\.charAt\(0\)\.toUpperCase\(\) \+ q\.slice\(1\)\}\*` \}, \{ quoted: msg \}\);\n        \} else \{\n            await this\.sock\.sendMessage\(jid, \{ text: `❌ \*\$\{q\} sedang tidak menampakkan diri\.\*` \}, \{ quoted: msg \}\);\n        \}/;

const newLogic = `        try {
           const p = await ab.pinterest(queries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: \`👻 *Penampakan \${q.charAt(0).toUpperCase() + q.slice(1)}*\` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: \`❌ *\${q} sedang tidak menampakkan diri.*\` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal memanggil hantu.*" }, { quoted: msg });
        }`;

if (code.match(regex)) {
    code = code.replace(regex, newLogic);
    fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
    console.log('Fixed hantu logic');
} else {
    console.log('Hantu logic not found, regex mismatch');
}
