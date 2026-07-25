const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /if \(msg\.message\?\.extendedTextMessage\?\.contextInfo\?\.mentionedJid\?\.length\) \{\s*targetJid = msg\.message\.extendedTextMessage\.contextInfo\.mentionedJid\[0\];\s*\} else if \(msg\.message\?\.extendedTextMessage\?\.contextInfo\?\.participant\) \{\s*targetJid = msg\.message\.extendedTextMessage\.contextInfo\.participant;\s*\} else if \(args\) \{\s*targetJid = this\.normalizeJid\(args \+ "@s\.whatsapp\.net"\);\s*\}/g;

const replacement = `if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args) {
        targetJid = this.normalizeJid(args + "@s.whatsapp.net");
      } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }`;

let count = 0;
code = code.replace(regex, () => {
    count++;
    return replacement;
});

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log(`Replaced ${count} occurrences.`);
