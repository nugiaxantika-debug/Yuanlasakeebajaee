const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `    } else if (body === ".listpoweredby" || body === "listpoweredby") {
      const current = this.poweredByText || "Belum diset";
      await this.sock.sendMessage(jid, { text: \`📋 *Daftar Powered By*\\n\\n1. \${current}\` }, { quoted: msg });`;

const replacement = `    } else if (body === ".listpoweredby" || body === "listpoweredby") {
      const current = this.poweredByText || "Belum diset";
      await this.sock.sendMessage(jid, { text: \`📋 *Daftar Powered By*\\n\\n1. \${current}\` }, { quoted: msg });
    } else if (body.startsWith(".linkset") || body.startsWith("linkset")) {
      const text = messageContent.replace(/^\\.?linkset\\s*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: \`Kirim perintah dengan link, contoh: .linkset jadibotbatakvip.biz.id\` }, { quoted: msg });
      } else {
        this.menuLink = text;
        this.saveBotSettings();
        this.broadcastState(\`Changed menu link to \${text}\`);
        await this.sock.sendMessage(jid, { text: \`✅ Berhasil mengubah link menu: \${text}\` }, { quoted: msg });
      }
    } else if (body === ".dellinkset" || body === "dellinkset") {
      this.menuLink = null;
      this.saveBotSettings();
      this.broadcastState(\`Deleted menu link\`);
      await this.sock.sendMessage(jid, { text: \`✅ Berhasil menghapus link menu\` }, { quoted: msg });
    } else if (body.startsWith(".chasetlink") || body.startsWith("chasetlink")) {
      const text = messageContent.replace(/^\\.?chasetlink\\s*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: \`Kirim perintah dengan link channel, contoh: .chasetlink https://whatsapp.com/channel/xxx\` }, { quoted: msg });
      } else {
        this.channelLink = text;
        this.saveBotSettings();
        this.broadcastState(\`Changed channel link to \${text}\`);
        await this.sock.sendMessage(jid, { text: \`✅ Berhasil mengubah link channel: \${text}\` }, { quoted: msg });
      }
    } else if (body === ".delchasetlink" || body === "delchasetlink") {
      this.channelLink = null;
      this.saveBotSettings();
      this.broadcastState(\`Deleted channel link\`);
      await this.sock.sendMessage(jid, { text: \`✅ Berhasil menghapus link channel\` }, { quoted: msg });`;

if (!content.includes('body.startsWith(".chasetlink")')) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', content);
    console.log("Success");
}
