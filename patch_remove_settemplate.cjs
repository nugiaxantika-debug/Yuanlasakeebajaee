const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
const regex = /\} else if \(body\.startsWith\("\.settemplate"\) \|\| body\.startsWith\("settemplate"\)\) \{[\s\S]*?\}\n    \} else if \(\['\.fakedana'/;
content = content.replace(regex, '} else if ([\'.fakedana\'');
fs.writeFileSync('src/services/whatsapp.ts', content);
