const fs = require('fs');
let code = fs.readFileSync('node_modules/duckduckgo-ai-chat-cjs/index.js', 'utf8');
code = code.replace(
    'const STATUS_HEADERS = { "x-vqd-accept": "1" };',
    'const STATUS_HEADERS = { "x-vqd-accept": "1", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };'
);
fs.writeFileSync('node_modules/duckduckgo-ai-chat-cjs/index.js', code);
