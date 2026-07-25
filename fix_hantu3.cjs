const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// I will make sure the if block handles cases without a command prefix cleanly, 
// just in case they sent ".fotpocong " with space or something. 
// But trim() handles it.

// Let's see what happens if they try to call .hantu pocong ? 
// The menu says ".fotpocong"

