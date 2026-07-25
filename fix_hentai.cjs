const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /      \} else \{\n        await this\.sock\.sendMessage\(jid, \{ text: `⏳ \*Mencari foto \$\{q\}\.\.\.\*` \}, \{ quoted: msg \}\);\n        try \{\n           const p = await ab\.pinterest\(queries\[q\]\);\n           if \(p && p\.result && p\.result\.result && p\.result\.result\.length > 0\) \{\n              const arr = p\.result\.result;\n              const randomIdx = Math\.floor\(Math\.random\(\) \* arr\.length\);\n              const imageUrl = arr\[randomIdx\]\.image_url \|\| arr\[randomIdx\]\.images\?\.original \|\| arr\[randomIdx\]\.images\?\.large;\n              await this\.sock\.sendMessage\(jid, \{ image: \{ url: imageUrl \}, caption: `🔞 \*NSFW \$\{q\.charAt\(0\)\.toUpperCase\(\) \+ q\.slice\(1\)\}\*` \}, \{ quoted: msg \}\);\n           \} else \{\n              await this\.sock\.sendMessage\(jid, \{ text: `❌ \*Foto \$\{q\} tidak ditemukan\.\*` \}, \{ quoted: msg \}\);\n           \}\n        \} catch \(e\) \{\n           await this\.sock\.sendMessage\(jid, \{ text: "❌ \*Gagal mengambil foto\.\*" \}, \{ quoted: msg \}\);\n        \}\n      \}/;

const newLogic = `      } else {
        await this.sock.sendMessage(jid, { text: \`⏳ *Mencari foto \${q}...*\` }, { quoted: msg });
        try {
            const danbooruTags: Record<string, string> = {
                "hentai": "rating:explicit",
                "nsfw": "rating:explicit",
                "ahegao": "rating:explicit+ahegao",
                "ass": "rating:explicit+ass",
                "bdsm": "rating:explicit+bdsm",
                "gangbang": "rating:explicit+group_sex",
                "gay": "rating:explicit+yaoi",
                "loli": "rating:explicit+loli",
                "neko": "rating:explicit+cat_girl",
                "pussy": "rating:explicit+pussy",
                "zettai": "rating:explicit+zettai_ryouiki"
            };
            const tag = danbooruTags[q] || "rating:explicit";
            const res = await axios.get(\`https://danbooru.donmai.us/posts.json?tags=\${tag}&limit=10&random=true\`);
            const item = res.data.find((x: any) => x.file_url || x.large_file_url);
            
            if (item) {
                const imageUrl = item.file_url || item.large_file_url;
                await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: \`🔞 *NSFW \${q.charAt(0).toUpperCase() + q.slice(1)}*\` }, { quoted: msg });
            } else {
                await this.sock.sendMessage(jid, { text: \`❌ *Foto \${q} tidak ditemukan.*\` }, { quoted: msg });
            }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      }`;

if (code.match(regex)) {
    code = code.replace(regex, newLogic);
    // ensure axios is imported
    if (!code.includes("import axios")) {
        code = `import axios from "axios";\n` + code;
    }
    fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
    console.log('Fixed hentai logic');
} else {
    console.log('Hentai logic not found, regex mismatch');
}
