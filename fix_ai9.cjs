const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const target = `         const imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(query)}?width=1024&height=1024&nologo=true\`;`;
const replacement = `         let imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(query)}?width=1024&height=1024&nologo=true\`;
         if (cmd === "nanobananaai") {
            imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(query + " nanobanana style")}?width=1024&height=1024&nologo=true&model=flux\`;
         }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Updated image URL");
