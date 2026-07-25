const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetRegex = /answer = "❌ \*Gagal mendapatkan respon AI\.\*[\s\S]*?GEMINI_API_KEY\` di Environment Variables Railway agar fitur AI berfungsi normal\.";/g;
const replacement = `answer = "❌ *Gagal mendapatkan respon AI.*\\n\\nKarena API gratis sedang gangguan (IP diblokir), kamu *WAJIB* menambahkan \`GEMINI_API_KEY\` di Environment Variables Railway agar fitur AI berfungsi normal.";`;

code = code.replace(targetRegex, replacement);

fs.writeFileSync('src/services/whatsapp.ts', code);
