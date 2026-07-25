const fs = require('fs');
const file = 'src/services/whatsapp.ts';
let code = fs.readFileSync(file, 'utf8');

const bokepMenuLogic = `    } else if (body === "bokepmenu" || body === ".bokepmenu" || body === "bokep menu" || body === ".bokep menu") {
      const bokepText = \`🔞 *Bokep Menu*

│ .vidbokepindonesia
│ .vidbokepmalaysia
│ .vidbokepjepang
│ .vidbokepchina
│ .vidbokepamerika\`;
      await this.sock.sendMessage(jid, { text: bokepText }, { quoted: msg });
      this.broadcastState(\`Responded to bokepmenu command\`);
    } else if (body.startsWith(".vidbokepindonesia") || body.startsWith("vidbokepindonesia")) {
        await this.sock.sendMessage(jid, { text: \`Fitur vidbokepindonesia akan segera hadir!\` }, { quoted: msg });
    } else if (body.startsWith(".vidbokepmalaysia") || body.startsWith("vidbokepmalaysia")) {
        await this.sock.sendMessage(jid, { text: \`Fitur vidbokepmalaysia akan segera hadir!\` }, { quoted: msg });
    } else if (body.startsWith(".vidbokepjepang") || body.startsWith("vidbokepjepang")) {
        await this.sock.sendMessage(jid, { text: \`Fitur vidbokepjepang akan segera hadir!\` }, { quoted: msg });
    } else if (body.startsWith(".vidbokepchina") || body.startsWith("vidbokepchina")) {
        await this.sock.sendMessage(jid, { text: \`Fitur vidbokepchina akan segera hadir!\` }, { quoted: msg });
    } else if (body.startsWith(".vidbokepamerika") || body.startsWith("vidbokepamerika")) {
        await this.sock.sendMessage(jid, { text: \`Fitur vidbokepamerika akan segera hadir!\` }, { quoted: msg });`;

code = code.replace(/    } else if \(body === "hentaimenu"/g, bokepMenuLogic + '\n    } else if (body === "hentaimenu"');

fs.writeFileSync(file, code);
