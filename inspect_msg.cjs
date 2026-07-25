const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
let match = code.match(/console.log\(`\[Message\] From: \$\{jid\} \| Content: \$\{body\}`\);/);
if (match) {
    code = code.replace(
        /console.log\(`\[Message\] From: \$\{jid\} \| Content: \$\{body\}`\);/,
        `console.log(\`[Message] From: \${jid} | Content: \${body}\`);
    if (body.startsWith(".inspect")) {
        console.log(JSON.stringify(msg, null, 2));
    }`
    );
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Injected inspect");
}
