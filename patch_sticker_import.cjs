const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

content = content.replace(
  "const { Sticker } = require('wa-sticker-formatter');",
  "const { Sticker } = await import('wa-sticker-formatter');"
);

fs.writeFileSync('src/services/whatsapp.ts', content);
