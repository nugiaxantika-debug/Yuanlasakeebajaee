const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/services/whatsapp.ts', 'utf8');

code = code.replace(
`          // Use the background removal node module
          const { removeBackground } = require('@imgly/background-removal-node');
          const blob = new Blob([media], { type: 'image/jpeg' });
          const resultBlob = await removeBackground(blob);
          const buffer = Buffer.from(await resultBlob.arrayBuffer());`,
`          // Use remove.bg API to save memory instead of local AI model
          const removeBgApiKey = process.env.REMOVEBG_API_KEY;
          let buffer;
          
          if (!removeBgApiKey) {
             return await this.sock.sendMessage(jid, { text: "❌ *Fitur hapusbgfoto dinonaktifkan.*\n\nKarena keterbatasan memori server (Railway), fitur ini membutuhkan *REMOVEBG_API_KEY*.\n\nCara mendapatkan:\n1. Daftar di https://www.remove.bg/api\n2. Dapatkan API Key gratis (50 foto/bulan)\n3. Tambahkan di Environment Variables Railway sebagai \`REMOVEBG_API_KEY\`." }, { quoted: msg });
          }
          
          const FormData = require('form-data');
          const formData = new FormData();
          formData.append('size', 'auto');
          formData.append('image_file', Buffer.from(media), 'image.jpg');
          
          const bgRes = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
              headers: {
                  ...formData.getHeaders(),
                  'X-Api-Key': removeBgApiKey
              },
              responseType: 'arraybuffer'
          });
          buffer = Buffer.from(bgRes.data);`
);

code = code.replace(
`answer = "❌ *Gagal mendapatkan respon AI.*\\n\\nKarena API gratis sedang gangguan (IP diblokir), kamu *WAJIB* menambahkan \`GEMINI_API_KEY\` di Environment Variables Railway agar fitur AI berfungsi normal.";`,
`answer = "❌ *Gagal mendapatkan respon AI.*\\n\\nKarena sistem AI publik gratis sering diblokir, kamu *WAJIB* menambahkan \`GEMINI_API_KEY\` di Dashboard Railway > Variables agar fitur AI berfungsi normal.\\n\\n*Cara mendapatkan API Key gratis:*\\n1. Buka https://aistudio.google.com/app/apikey\\n2. Buat API Key baru\\n3. Copy dan masukkan sebagai variable \`GEMINI_API_KEY\` di Railway.";`
);

fs.writeFileSync('/app/applet/src/services/whatsapp.ts', code);
console.log("Patched BG and AI Instructions successfully!");
