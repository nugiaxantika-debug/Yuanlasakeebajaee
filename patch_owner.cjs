const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

if (!code.includes('private normalizeJid(jidStr')) {
  // Add normalizeJid method after broadcastState
  code = code.replace(/private broadcastState[^{]+{[^}]+}/, `$&

  private normalizeJid(jidStr: string): string {
    if (!jidStr) return "";
    let clean = jidStr.replace(/:\\d+/, "");
    const parts = clean.split("@");
    let numPart = parts[0].replace(/[^0-9]/g, "");
    if (numPart.startsWith("0")) {
        numPart = "62" + numPart.slice(1);
    }
    if (clean.includes("@g.us")) {
        return numPart + "@g.us";
    }
    return numPart + "@s.whatsapp.net";
  }`);

  // Patch loadBotSettings
  code = code.replace(/this\.ownerNumbers = new Set\(obj\.ownerNumbers\.map\(\(n: string\) => n\.replace\(\/:\\d\+\/, ""\)\)\);/g, 'this.ownerNumbers = new Set(obj.ownerNumbers.map((n: string) => this.normalizeJid(n)));');
  code = code.replace(/this\.premiumNumbers = new Set\(obj\.premiumNumbers\.map\(\(n: string\) => n\.replace\(\/:\\d\+\/, ""\)\)\);/g, 'this.premiumNumbers = new Set(obj.premiumNumbers.map((n: string) => this.normalizeJid(n)));');

  // Patch senderJid in handleIncomingMessage
  code = code.replace(/const senderJid = typeof senderJidRaw === 'string' \? senderJidRaw\.replace\(\/:\\d\+\/, ""\) : senderJidRaw;/g, "const senderJid = typeof senderJidRaw === 'string' ? this.normalizeJid(senderJidRaw) : senderJidRaw;");

  // Patch addpremium
  code = code.replace(/targetJid = args\.replace\(\/\[\^0-9\]\/g, ""\) \+ "@s\.whatsapp\.net";/g, 'targetJid = this.normalizeJid(args + "@s.whatsapp.net");');
  
  // Patch targetJid cleaning
  code = code.replace(/if \(targetJid\) targetJid = targetJid\.replace\(\/:\\d\+\/, ""\);/g, 'if (targetJid) targetJid = this.normalizeJid(targetJid);');

  fs.writeFileSync('src/services/whatsapp.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Already patched");
}
