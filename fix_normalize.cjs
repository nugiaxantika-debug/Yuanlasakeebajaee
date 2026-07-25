const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /private normalizeJid\(jidStr: string\): string \{[\s\S]*?return numPart \+ "@s\.whatsapp\.net";\s*\}/;

const replacement = `private normalizeJid(jidStr: string): string {
    if (!jidStr) return "";
    let clean = jidStr.replace(/:\\d+/, "");
    
    if (clean.endsWith("@g.us")) {
        let groupNum = clean.split("@")[0];
        return groupNum + "@g.us";
    }

    let numPart = clean.replace(/[^0-9]/g, "");
    
    if (numPart.startsWith("0")) {
        numPart = "62" + numPart.slice(1);
    }
    
    return numPart + "@s.whatsapp.net";
  }`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Replaced normalizeJid");
} else {
    console.log("Could not find normalizeJid");
}
