const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const coganLogic = `
    } else if (body === "coganmenu" || body === ".coganmenu" || body === "cogan menu" || body === ".cogan menu") {
      const coganText = \`👨 *Cogan Menu*\n\n│ .coganiqbaal\n│ .coganjefrinichol\n│ .coganangga\n│ .coganverrell\n│ .coganrizky\n│ .coganjepang\n│ .cogankorea\n│ .coganthailand\n│ .coganchina\n│ .cogandenji\n│ .cogangojo\n│ .coganlevi\n│ .coganluffy\n│ .cogansasuke\n│ .cogannaruto\n│ .cogankakashi\`;
      await this.sock.sendMessage(jid, { text: coganText }, { quoted: msg });
      this.broadcastState(\`Responded to coganmenu command\`);
    } else if (coganCommands.includes(body)) {
      const q = messageContent.replace(/^\\.?cogan/i, "").trim().toLowerCase();
      const coganQueries: Record<string, string> = {
        "iqbaal": "foto iqbaal ramadhan ganteng",
        "jefrinichol": "foto jefri nichol ganteng",
        "angga": "foto angga yunanda ganteng",
        "verrell": "foto verrell bramasta ganteng",
        "rizky": "foto rizky nazar ganteng",
        "jepang": "japanese handsome guy",
        "korea": "korean handsome guy ulzzang",
        "thailand": "thai handsome guy actor",
        "china": "chinese handsome guy actor",
        "denji": "denji chainsaw man icon aesthetic",
        "gojo": "gojo satoru icon aesthetic",
        "levi": "levi ackerman icon aesthetic",
        "luffy": "monkey d luffy icon aesthetic",
        "sasuke": "sasuke uchiha icon aesthetic",
        "naruto": "naruto uzumaki icon aesthetic",
        "kakashi": "kakashi hatake icon aesthetic"
      };
      
      if (coganQueries[q]) {
        await this.sock.sendMessage(jid, { text: \`⏳ *Mencari foto \${q}...*\` }, { quoted: msg });
        try {
           const p = await ab.pinterest(coganQueries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: \`👨 *Cogan \${q.charAt(0).toUpperCase() + q.slice(1)}*\` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: \`❌ *Foto \${q} tidak ditemukan.*\` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      }`;

if (!code.includes('} else if (body === "coganmenu"')) {
    const targetStr = '} else if (body === "postermenu" || body === ".postermenu" || body === "poster menu" || body === ".poster menu") {';
    code = code.replace(targetStr, coganLogic + "\n    " + targetStr);
    fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
    console.log("Added coganmenu logic!");
} else {
    console.log("Already has coganmenu logic");
}
