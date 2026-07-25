const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /\} else if \(body === "\.owner" \|\| body === "owner"\) \{[\s\S]*?await this\.sock\.sendMessage\(jid, \{ text \}, \{ quoted: msg \}\);\s*\}/;

const replacement = `} else if (body === ".owner" || body === "owner") {
       const owners = Array.from(this.ownerNumbers);
       let text = "👑 *Pemilik Bot*\\n\\n";
       if (owners.length > 0) {
           owners.forEach((num, i) => text += \`\${i+1}. @\${num.split('@')[0]}\\n\`);
       } else {
           text += "Belum ada owner yang ditambahkan.\\n(Untuk menambahkan: .addowner @user)";
       }
       await this.sock.sendMessage(jid, { text, mentions: owners }, { quoted: msg });
    }`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Replaced .owner command");
} else {
    console.log("Could not find .owner command");
}
