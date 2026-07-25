const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// Append .videosexybikini to tiktok video commands condition
content = content.replace(
  "body.startsWith(\".tiktokpointblank\") || body.startsWith(\"tiktokpointblank\")) {",
  "body.startsWith(\".tiktokpointblank\") || body.startsWith(\"tiktokpointblank\") || body.startsWith(\".videosexybikini\") || body.startsWith(\"videosexybikini\")) {"
);

// Inject logic right before togel
const newLogic = `    } else if (body.startsWith(".attp") || body.startsWith("attp")) {
       const text = messageContent.replace(/^\\.?attp\\s*/i, "").trim();
       if (!text) {
          await this.sock.sendMessage(jid, { text: \`Kirim teks untuk dibuat stiker attp!\\nContoh: .attp Halo\` }, { quoted: msg });
       } else {
          try {
             await this.sock.sendMessage(jid, { text: \`⏳ *Sedang membuat stiker ATTP...*\` }, { quoted: msg });
             const url = \`https://api.vreden.my.id/api/maker/attp?text=\${encodeURIComponent(text)}\`;
             try {
                // If the API works, it will return a webp buffer
                const res = await axios.get(url, { responseType: 'arraybuffer' });
                await this.sock.sendMessage(jid, { sticker: Buffer.from(res.data) }, { quoted: msg });
             } catch (err) {
                 // Fallback to text SVG
                 const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                 const svgMeme = \`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                   <rect width="512" height="512" fill="transparent"/>
                   <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#ff0055">\${safeText}</text>
                 </svg>\`;
                 const bgBuffer = Buffer.from(svgMeme);
                 const { Sticker } = await import('wa-sticker-formatter');
                 const sticker = new Sticker(bgBuffer, { pack: 'ATTP', author: 'Bot', type: 'full' });
                 const finalBuffer = await sticker.toBuffer();
                 await this.sock.sendMessage(jid, { sticker: finalBuffer }, { quoted: msg });
             }
          } catch (e) {
             console.error("ATTP error: ", e);
             await this.sock.sendMessage(jid, { text: \`❌ Gagal membuat ATTP.\` }, { quoted: msg });
          }
       }
    } else if (body.startsWith(".logo") || body.startsWith("logo")) {
       const text = messageContent.replace(/^\\.?logo\\s*/i, "").trim();
       if (!text) {
          await this.sock.sendMessage(jid, { text: \`Kirim teks untuk dibuat logo!\\nContoh: .logo Keren\` }, { quoted: msg });
       } else {
          try {
             await this.sock.sendMessage(jid, { text: \`⏳ *Sedang membuat logo...*\` }, { quoted: msg });
             const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
             const svgLogo = \`<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
               <defs>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" style="stop-color:rgb(131,58,180);stop-opacity:1" />
                   <stop offset="50%" style="stop-color:rgb(253,29,29);stop-opacity:1" />
                   <stop offset="100%" style="stop-color:rgb(252,176,69);stop-opacity:1" />
                 </linearGradient>
               </defs>
               <rect width="100%" height="100%" fill="url(#grad1)"/>
               <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Verdana, sans-serif" font-size="80" font-weight="bold" fill="white" stroke="black" stroke-width="2">\${safeText}</text>
             </svg>\`;
             const finalBuffer = await sharp(Buffer.from(svgLogo)).png().toBuffer();
             await this.sock.sendMessage(jid, { image: finalBuffer, caption: \`🎨 *Logo berhasil dibuat!*\` }, { quoted: msg });
          } catch (e) {
             console.error("Logo error: ", e);
             await this.sock.sendMessage(jid, { text: \`❌ Gagal membuat logo.\` }, { quoted: msg });
          }
       }
    } else if (body.startsWith(".wallpaper") || body.startsWith("wallpaper")) {
       try {
           await this.sock.sendMessage(jid, { text: \`⏳ *Sedang mencari wallpaper...*\` }, { quoted: msg });
           const res = await axios.get("https://nekos.life/api/v2/img/wallpaper");
           if (res.data && res.data.url) {
               await this.sock.sendMessage(jid, { image: { url: res.data.url }, caption: \`🖼️ *Wallpaper Ditemukan!*\` }, { quoted: msg });
           } else {
               await this.sock.sendMessage(jid, { text: \`❌ Gagal menemukan wallpaper.\` }, { quoted: msg });
           }
       } catch (e) {
           console.error("Wallpaper error:", e);
           await this.sock.sendMessage(jid, { text: \`❌ Gagal mencari wallpaper.\` }, { quoted: msg });
       }
    } else if (body.startsWith(".fotoandroid") || body.startsWith("fotoandroid")) {
       const text = messageContent.replace(/^\\.?fotoandroid\\s*/i, "").trim();
       if (!text) {
          await this.sock.sendMessage(jid, { text: \`Kirim teks untuk dibuat foto notifikasi Android!\\nContoh: .fotoandroid Halo\` }, { quoted: msg });
       } else {
          try {
             const pushName = msg.pushName || "User";
             const safePushName = pushName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 25);
             let chunkedText = text;
             if (chunkedText.length > 60) chunkedText = chunkedText.substring(0, 57) + "...";
             const safeText = chunkedText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
             
             const svgMeme = \`<svg width="600" height="150" xmlns="http://www.w3.org/2000/svg">
               <rect width="600" height="150" fill="#202124" />
               <rect x="20" y="25" width="40" height="40" rx="20" fill="#25D366" />
               <path d="M40,35 L40,55 M30,45 L50,45" stroke="white" stroke-width="4" stroke-linecap="round"/>
               <text x="80" y="45" font-family="Roboto, Arial, sans-serif" font-size="20" font-weight="bold" fill="#e8eaed">WhatsApp • now</text>
               <text x="80" y="85" font-family="Roboto, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">\${safePushName}</text>
               <text x="80" y="125" font-family="Roboto, Arial, sans-serif" font-size="24" fill="#9aa0a6">\${safeText}</text>
             </svg>\`;
             
             const bgBuffer = Buffer.from(svgMeme);
             const finalBuffer = await sharp(bgBuffer).png().toBuffer();
             await this.sock.sendMessage(jid, { image: finalBuffer, caption: 'Notifikasi Android 📱' }, { quoted: msg });
          } catch (e) {
             console.error("Fotoandroid error: ", e);
             await this.sock.sendMessage(jid, { text: \`❌ Gagal membuat fotoandroid.\` }, { quoted: msg });
          }
       }
`;

content = content.replace("    } else if (body.startsWith(\".togel \") || body.startsWith(\"togel \")) {", newLogic + "    } else if (body.startsWith(\".togel \") || body.startsWith(\"togel \")) {");

fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Features injected.");
