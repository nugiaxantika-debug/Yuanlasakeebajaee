const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const startIndex = content.indexOf('      try {\n        if (this.channelLink) {');
if (startIndex !== -1) {
  const endIndex = content.indexOf('      } catch (err: any) {', startIndex);
  if (endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    
    const newBlock = `      try {
        if (this.channelLink) {
          menu += \`\\n\\n🔗 *Link Saluran:* \${this.channelLink}\`;
        }

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
        
        this.broadcastState(\`Responded to allmenu command\`);
`;
    content = before + newBlock + after;
    fs.writeFileSync('src/services/whatsapp.ts', content);
    console.log("Success");
  } else {
    console.log("Failed to find endIndex");
  }
} else {
    console.log("Failed to find startIndex");
}
