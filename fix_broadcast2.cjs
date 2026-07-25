const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const brokenPart = /private broadcastState\(message: string\) \{[\s\S]*?this\.io\.to\(this\.userEmail\)\.emit\("log", \{ time: new Date\(\)\.toISOString\(\), message \}\);\s*\}/;
const replacement = `private broadcastState(message: string) {
    console.log(\`[\${this.userEmail}] \${message}\`);
    this.io.to(this.userEmail).emit("log", { time: new Date().toISOString(), message });
  }

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
  }`;

code = code.replace(brokenPart, replacement);
fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed!");
