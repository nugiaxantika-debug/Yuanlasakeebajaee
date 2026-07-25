const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// Find: const isOwner = msg.key.fromMe || this.ownerNumbers.has(senderJid);
const target = "const isOwner = msg.key.fromMe || this.ownerNumbers.has(senderJid);";
const replacement = `console.log("[DEBUG] senderJid:", senderJid);
    console.log("[DEBUG] ownerNumbers:", Array.from(this.ownerNumbers));
    console.log("[DEBUG] msg.key.fromMe:", msg.key.fromMe);
    const isOwner = msg.key.fromMe || this.ownerNumbers.has(senderJid);
    console.log("[DEBUG] isOwner:", isOwner);`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Patched successfully");
} else {
    console.log("Could not find target string");
}
