const fs = require('fs');
const content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('Masih dalam pengembangan') || line.includes('mememenu') || line.includes('meme')) {
        console.log(i + 1, line.trim());
    }
});
