const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const posterLogic = `
    } else if (body === "postermenu" || body === ".postermenu" || body === "poster menu" || body === ".poster menu") {
      const posterText = \`🎬 *Poster Menu*\n\n│ .pengabdisetan\n│ .kkndidesapenari\n│ .sewudino\n│ .impetigore\n│ .rumahdara\n│ .qodrat\n│ .kuntilanak\n│ .jelangkung\n│ .keramat\n│ .suzzanna\n│ .mangkujiwo\n│ .losmenmelati\`;
      await this.sock.sendMessage(jid, { text: posterText }, { quoted: msg });
      this.broadcastState(\`Responded to postermenu command\`);
    } else if (posterCommands.includes(body)) {
      const q = messageContent.replace(/^\\.?/i, "").trim().toLowerCase();
      const posterQueries: Record<string, string> = {
        "pengabdisetan": "poster film pengabdi setan",
        "kkndidesapenari": "poster film kkn di desa penari",
        "sewudino": "poster film sewu dino",
        "impetigore": "poster film perempuan tanah jahanam",
        "rumahdara": "poster film rumah dara macabre",
        "qodrat": "poster film qodrat",
        "kuntilanak": "poster film kuntilanak horror",
        "jelangkung": "poster film jelangkung 2001",
        "keramat": "poster film keramat 2009",
        "suzzanna": "poster film suzzanna bernapas dalam kubur",
        "mangkujiwo": "poster film mangkujiwo",
        "losmenmelati": "poster film losmen melati"
      };
      
      if (posterQueries[q]) {
        await this.sock.sendMessage(jid, { text: \`⏳ *Mencari poster \${q}...*\` }, { quoted: msg });
        try {
           const p = await ab.pinterest(posterQueries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: \`🎬 *Poster \${q.charAt(0).toUpperCase() + q.slice(1)}*\` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: \`❌ *Poster \${q} tidak ditemukan.*\` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil poster.*" }, { quoted: msg });
        }
      }`;

if (!code.includes('} else if (body === "postermenu"')) {
    const targetStr = '} else if (body === "hantumenu" || body === ".hantumenu" || body === "hantu menu" || body === ".hantu menu") {';
    code = code.replace(targetStr, posterLogic + "\n    " + targetStr);
    fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
    console.log("Added postermenu logic!");
} else {
    console.log("Already has postermenu logic");
}
