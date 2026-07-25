const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// 1. Add menuLink property and settings parsing
if (!content.includes('private menuLink: string | null = "jadibotbatakvip.biz.id";')) {
    content = content.replace(
        'private autoTypingEnabled: boolean = false;',
        'private autoTypingEnabled: boolean = false;\n  private menuLink: string | null = "jadibotbatakvip.biz.id";'
    );
}

if (!content.includes('if (obj.menuLink !== undefined) this.menuLink = obj.menuLink;')) {
    content = content.replace(
        'if (obj.autoTypingEnabled !== undefined) this.autoTypingEnabled = obj.autoTypingEnabled;',
        'if (obj.autoTypingEnabled !== undefined) this.autoTypingEnabled = obj.autoTypingEnabled;\n      if (obj.menuLink !== undefined) this.menuLink = obj.menuLink;'
    );
}

if (!content.includes('menuLink: this.menuLink')) {
    content = content.replace(
        'autoTypingEnabled: this.autoTypingEnabled',
        'autoTypingEnabled: this.autoTypingEnabled,\n      menuLink: this.menuLink'
    );
}

// 2. Add Link to header in the menu
if (!content.includes('${this.menuLink ? this.menuLink + "\\n" : ""}📅 Tanggal: ${dateStr}')) {
    content = content.replace(
        'Bisa membantu kamu\n📅 Tanggal: ${dateStr}',
        'Bisa membantu kamu\n${this.menuLink ? this.menuLink + "\\n" : ""}📅 Tanggal: ${dateStr}'
    );
}

// 3. Add linkset and dellinkset in ownerCommands
if (!content.includes("'linkset'")) {
    content = content.replace(
        "'.listpoweredby', 'listpoweredby'",
        "'.listpoweredby', 'listpoweredby', '.linkset', 'linkset', '.dellinkset', 'dellinkset'"
    );
}
if (!content.includes("│ .linkset")) {
    content = content.replace(
        "│ .listpoweredby",
        "│ .listpoweredby\n│ .linkset\n│ .dellinkset"
    );
}

// 4. Add the implementation of .linkset and .dellinkset
if (!content.includes('.linkset')) {
    const replacement1 = `    } else if (body === ".listpoweredby" || body === "listpoweredby") {
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
      await this.sock.sendMessage(jid, { text: \`✅ Berhasil menghapus link menu\` }, { quoted: msg });`;
    
    content = content.replace(/    \} else if \(body === "\.listpoweredby" \|\| body === "listpoweredby"\) \{\n      const current = this\.poweredByText \|\| "Belum diset";\n      await this\.sock\.sendMessage\(jid, \{ text: `📋 \*Daftar Powered By\*\\n\\n1\. \$\{current\}` \}, \{ quoted: msg \}\);/, replacement1);
}

// 5. Apply ad context patch for the menu sending
const targetStrAd = `      if (this.coverImageBuffer) {
        await this.sock.sendMessage(jid, { image: this.coverImageBuffer, caption: menu }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: menu }, { quoted: msg });
      }
      this.broadcastState(\`Responded to allmenu command\`);`;

const replacementCodeAd = `      const botJid = this.sock.user?.id ? this.sock.user.id.split(':')[0] + '@s.whatsapp.net' : '6281234567890@s.whatsapp.net';
      const adContext = {
        forwardingScore: 999,
        isForwarded: true,
        businessMessageForwardInfo: {
          businessOwnerJid: botJid
        }
      };
      
      if (this.coverImageBuffer) {
        await this.sock.sendMessage(jid, { 
          image: this.coverImageBuffer, 
          caption: menu,
          contextInfo: adContext
        }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { 
          text: menu,
          contextInfo: adContext
        }, { quoted: msg });
      }
      this.broadcastState(\`Responded to allmenu command\`);`;

if (content.includes(targetStrAd)) {
    content = content.replace(targetStrAd, replacementCodeAd);
}

// 6. Fix totalfitur string calculation
const oldTotalFitur = `const totalFitur = ownerCommands.length + groupCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + funCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length + deviceCommands.length + tiketCommands.length + karyawanCommands.length + bokepCommands.length;`;
const newTotalFitur = `const totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length + deviceCommands.length + tiketCommands.length + karyawanCommands.length + hewanCommands.length + bokepCommands.length;`;

if (content.includes(oldTotalFitur)) {
    content = content.replace(oldTotalFitur, newTotalFitur);
}

fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Success");
