const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// The broken code is:
// console.log(`[${this.userEmail}  private normalizeJid(jidStr: string): string { ... }] ${message}`);

const brokenCode = /console\.log\(`\[\$\{this\.userEmail\}  private normalizeJid.*?\] \$\{message\}`\);/s;
if (brokenCode.test(code)) {
    code = code.replace(brokenCode, "console.log(`[${this.userEmail}] ${message}`);");
}

const missingNormalize = !code.includes('private normalizeJid(');
if (missingNormalize) {
    code = code.replace(/private broadcastState\(message: string\) \{[\s\S]*?\}/, `$&

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
}
fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed broadcastState");
