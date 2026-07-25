const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const hentaimenuLogic = `    } else if (body === "hentaimenu" || body === ".hentaimenu" || body === "hentai menu" || body === ".hentai menu") {
      const hentaiText = \`🔞 *Hentai Menu*\\n\\n│ .hentai\\n│ .nsfw\\n│ .nsfwahegao\\n│ .nsfwass\\n│ .nsfwbdsm\\n│ .nsfwgangbang\\n│ .nsfwgay\\n│ .nsfwloli\\n│ .nsfwneko\\n│ .nsfwpussy\\n│ .nsfwzettai\`;
      await this.sock.sendMessage(jid, { text: hentaiText }, { quoted: msg });
      this.broadcastState(\`Responded to hentaimenu command\`);
    } else if ((body.startsWith(".hentai") || body.startsWith("hentai") || body.startsWith(".nsfw") || body.startsWith("nsfw")) && body !== ".hentaimenu" && body !== "hentaimenu") {
      let q = messageContent.replace(/^\\.?(hentai|nsfw)/i, "").trim().toLowerCase();
      if (!q && (body.startsWith(".hentai") || body.startsWith("hentai"))) q = "hentai";
      if (!q && (body.startsWith(".nsfw") || body.startsWith("nsfw"))) q = "nsfw";
      
      const queries: Record<string, string> = {
        "hentai": "hentai anime",
        "nsfw": "nsfw anime",
        "ahegao": "ahegao face anime",
        "ass": "anime ass",
        "bdsm": "anime bdsm",
        "gangbang": "anime gangbang",
        "gay": "anime yaoi",
        "loli": "anime loli",
        "neko": "anime neko girl",
        "pussy": "anime pussy",
        "zettai": "anime zettai ryouiki"
      };

      if (!queries[q]) {
         await this.sock.sendMessage(jid, { text: \`❌ *Kategori tidak ditemukan.*\` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: \`⏳ *Mencari foto \${q}...*\` }, { quoted: msg });
        try {
           const p = await ab.pinterest(queries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: \`🔞 *NSFW \${q.charAt(0).toUpperCase() + q.slice(1)}*\` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: \`❌ *Foto \${q} tidak ditemukan.*\` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      }
    } else if (body === "hantumenu" || body === ".hantumenu" || body === "hantu menu" || body === ".hantu menu") {
      const hantuText = \`👻 *Hantu Menu*\\n\\n│ .fotpocong\\n│ .fotkuntilanak\\n│ .fotgenderuwo\\n│ .fotwewegombel\\n│ .fottuyul\\n│ .fotsundelbolong\\n│ .fotpalasik\\n│ .fotkuyang\\n│ .fotbanaspati\\n│ .fotjelangkung\\n│ .fotsiluman\\n│ .fotnyirorokidul\\n│ .fotgundulpringis\`;
      await this.sock.sendMessage(jid, { text: hantuText }, { quoted: msg });
      this.broadcastState(\`Responded to hantumenu command\`);
    } else if (body.startsWith(".fot") || body.startsWith("fot")) {
      const q = messageContent.replace(/^\\.?fot/i, "").trim().toLowerCase();
      const queries: Record<string, string> = {
        "pocong": "hantu pocong asli seram",
        "kuntilanak": "hantu kuntilanak seram",
        "genderuwo": "hantu genderuwo asli",
        "wewegombel": "hantu wewe gombel",
        "tuyul": "hantu tuyul penampakan",
        "sundelbolong": "hantu sundel bolong seram",
        "palasik": "hantu palasik sumatera",
        "kuyang": "hantu kuyang kalimantan",
        "banaspati": "hantu banaspati api",
        "jelangkung": "boneka jelangkung mistis",
        "siluman": "siluman mistis nusantara",
        "nyirorokidul": "lukisan nyi roro kidul",
        "gundulpringis": "hantu gundul pringis"
      };

      if (queries[q]) {
        await this.sock.sendMessage(jid, { text: \`⏳ *Memanggil \${q}...*\` }, { quoted: msg });
        try {
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
        }
      } else if (body.startsWith(".fotosexy") || body.startsWith("fotosexy") || body.startsWith(".fotoanime") || body.startsWith("fotoanime") || body.startsWith(".fotoip") || body.startsWith("fotoip")) {
        // let the other handlers deal with this
      }
`;

code = code.replace(
  `    } else if ((body.startsWith(".anime") || body.startsWith("anime")) && body !== ".animemenu" && body !== "animemenu") {`,
  hentaimenuLogic + `\n    } else if ((body.startsWith(".anime") || body.startsWith("anime")) && body !== ".animemenu" && body !== "animemenu") {`
);

fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
