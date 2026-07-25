const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// 1. Remove property
content = content.replace(/\n\s*private channelLink: string \| null = null;/, '');

// 2. Remove from loadBotSettings
content = content.replace(/\n\s*if \(obj\.channelLink !== undefined\) this\.channelLink = obj\.channelLink;/, '');

// 3. Remove from saveBotSettings
content = content.replace(/,\n\s*channelLink: this\.channelLink/, '');

// 4. Remove from ownerCommands
content = content.replace(/, '\.chasetlink', 'chasetlink', '\.delchasetlink', 'delchasetlink'/, '');

// 5. Remove from ownermenu
content = content.replace(/\n│ \.chasetlink\n│ \.delchasetlink/, '');

// 6. Remove handlers
const handlersMatch = /    \} else if \(body\.startsWith\("\.chasetlink"\) \|\| body\.startsWith\("chasetlink"\)\) {[\s\S]*?\} else if \(body === "\.delchasetlink" \|\| body === "delchasetlink"\) {[\s\S]*?await this\.sock\.sendMessage\(jid, \{ text: `✅ Berhasil menghapus link channel` \}, \{ quoted: msg \}\);\n/;

if (handlersMatch.test(content)) {
    content = content.replace(handlersMatch, '');
} else {
    console.log("Failed to find handlers to remove.");
}

// 7. Remove from allmenu
const allmenuMatch = /        if \(this\.channelLink\) \{\n          menu \+= `\\n\\n🔗 \*Link Saluran:\* \$\{this\.channelLink\}`;\n        \}\n\n/;

if (allmenuMatch.test(content)) {
    content = content.replace(allmenuMatch, '');
} else {
    console.log("Failed to find allmenu channel link addition.");
}

fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Done");
