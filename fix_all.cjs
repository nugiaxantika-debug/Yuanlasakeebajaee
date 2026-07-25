const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// Fix welcome message catch
text = text.replace(/catch \(e: any\) \{\n    console\.error\(e\);\n    await this\.sock\.sendMessage\(jid, \{ text: "❌ \*Gagal membuat gambar " \+ cmd \+ "\*\\nDetail: " \+ e\.message \}, \{ quoted: msg \}\);\n\}\`\);/, 
`catch (e: any) {
    console.error("Failed to send welcome message:", e);
}`);

// Fix fakedana syntax error at line 3303
text = text.replace(/await this\.sock\.sendMessage\(jid, \{ text: \\`❌ \*Gagal membuat gambar \\\$\{cmd\}\*\\nDetail: \\\$\{e\.message\}\\` \}, \{ quoted: msg \}\);/, 
'await this.sock.sendMessage(jid, { text: `❌ *Gagal membuat gambar ${cmd}*\\nDetail: ${e.message}` }, { quoted: msg });');

fs.writeFileSync('src/services/whatsapp.ts', text);
