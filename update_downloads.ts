import fs from 'fs';

let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

content = content.replace(
/    } else if \(body\.startsWith\("\.ttsaudio"\) \|\| body\.startsWith\("ttsaudio"\)\) \{[\s\S]*?    \} else if \(body\.startsWith\("\.tiktokslide"\) \|\| body\.startsWith\("tiktokslide"\)\) \{/,
`    } else if (body.startsWith(".ttsaudio") || body.startsWith("ttsaudio")) {
      const text = messageContent.replace(/^\\.?ttsaudio\\s*/i, "").trim();
      if (!text) {
          await this.sock.sendMessage(jid, { text: \`Kirim teks untuk dijadikan audio!\\nContoh: .ttsaudio Halo semuanya\` }, { quoted: msg });
      } else {
          try {
              await this.sock.sendMessage(jid, { text: "⏳ *Sedang memproses TTS...*" }, { quoted: msg });
              const url = \`https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=id&q=\${encodeURIComponent(text)}\`;
              const res = await axios.get(url, { responseType: 'arraybuffer' });
              await this.sock.sendMessage(jid, { audio: Buffer.from(res.data), mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
          } catch (e) {
              console.error("TTS error:", e);
              await this.sock.sendMessage(jid, { text: \`❌ Gagal membuat TTS audio.\` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".tiktokslide") || body.startsWith("tiktokslide")) {`
);

content = content.replace(
/    \} else if \(body\.startsWith\("\.tiktokslide"\) \|\| body\.startsWith\("tiktokslide"\)\) \{[\s\S]*?    \} else if \(body\.startsWith\("\.ssweb"\) \|\| body\.startsWith\("ssweb"\)\) \{/,
`    } else if (body.startsWith(".tiktokslide") || body.startsWith("tiktokslide")) {
      const urlMatches = messageContent.match(/(https?:\\/\\/[^\\s]+)/g);
      if (!urlMatches) {
        await this.sock.sendMessage(jid, { text: "Kirim link TikTok slide!\\nContoh: .tiktokslide https://vt.tiktok.com/xxx/" }, { quoted: msg });
      } else {
        try {
          await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil gambar TikTok...*" }, { quoted: msg });
          const url = urlMatches[0];
          const fetchRes = await axios.get(\`https://www.tikwm.com/api/?url=\${url}\`);
          if (fetchRes.data && fetchRes.data.code === 0 && fetchRes.data.data.images) {
             const images = fetchRes.data.data.images;
             await this.sock.sendMessage(jid, { text: \`✅ *Menemukan \${images.length} gambar slide, sedang mengirim...*\` }, { quoted: msg });
             for (const imgUrl of images) {
                 await this.sock.sendMessage(jid, { image: { url: imgUrl } }, { quoted: msg });
                 await new Promise(resolve => setTimeout(resolve, 500));
             }
          } else {
             await this.sock.sendMessage(jid, { text: "❌ Ini bukan video slide gambar atau video tidak ditemukan." }, { quoted: msg });
          }
        } catch (e) {
          console.error("Tiktokslide error:", e);
          await this.sock.sendMessage(jid, { text: \`❌ Gagal mengambil tiktok slide.\` }, { quoted: msg });
        }
      }
    } else if (body.startsWith(".ssweb") || body.startsWith("ssweb")) {`
);

content = content.replace(
/    \} else if \(body\.startsWith\("\.ssweb"\) \|\| body\.startsWith\("ssweb"\)\) \{[\s\S]*?    \} else if \(body\.startsWith\("\.gdrive"\) \|\| body\.startsWith\("gdrive"\)\) \{/,
`    } else if (body.startsWith(".ssweb") || body.startsWith("ssweb")) {
      const url = messageContent.replace(/^\\.?ssweb\\s*/i, "").trim();
      if (!url) {
          await this.sock.sendMessage(jid, { text: \`Kirim link website untuk di screenshot!\\nContoh: .ssweb https://google.com\` }, { quoted: msg });
      } else {
          try {
              await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil screenshot...*" }, { quoted: msg });
              const targetUrl = url.startsWith("http") ? url : \`https://\${url}\`;
              const ssUrl = \`https://image.thum.io/get/width/1920/crop/1080/noanimate/\${targetUrl}\`;
              // Download buffer manually to avoid timeout issues
              const res = await axios.get(ssUrl, { responseType: 'arraybuffer', timeout: 15000 });
              await this.sock.sendMessage(jid, { image: Buffer.from(res.data), caption: \`✅ Screenshot dari \${targetUrl}\` }, { quoted: msg });
          } catch (e) {
              console.error("SSWeb error:", e);
              await this.sock.sendMessage(jid, { text: \`❌ Gagal mengambil screenshot web.\` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".gdrive") || body.startsWith("gdrive")) {`
);

content = content.replace(
/    \} else if \(body\.startsWith\("\.gdrive"\) \|\| body\.startsWith\("gdrive"\)\) \{[\s\S]*?    \} else if \(body\.startsWith\("\.mediafire"\) \|\| body\.startsWith\("mediafire"\)\) \{/,
`    } else if (body.startsWith(".gdrive") || body.startsWith("gdrive")) {
      const urlMatches = messageContent.match(/(https?:\\/\\/[^\\s]+)/g);
      if (!urlMatches) {
          await this.sock.sendMessage(jid, { text: \`Kirim link Google Drive!\\nContoh: .gdrive https://drive.google.com/file/d/xxx/view\` }, { quoted: msg });
      } else {
          try {
              const url = urlMatches[0];
              const match = url.match(/[-\\w]{25,}/);
              if (match) {
                  const fileId = match[0];
                  const directLink = \`https://drive.google.com/uc?export=download&id=\${fileId}\`;
                  await this.sock.sendMessage(jid, { text: \`⏳ *Sedang memproses link Google Drive...*\\n\\nLink Langsung: \${directLink}\` }, { quoted: msg });
                  // Try to download and send if it's not too large
                  try {
                      await this.sock.sendMessage(jid, { document: { url: directLink }, mimetype: 'application/octet-stream', fileName: 'GDrive_File' }, { quoted: msg });
                  } catch (e) {
                      await this.sock.sendMessage(jid, { text: \`File mungkin terlalu besar untuk dikirim via bot. Silakan gunakan link di atas untuk mendownload secara manual.\` }, { quoted: msg });
                  }
              } else {
                  await this.sock.sendMessage(jid, { text: \`❌ Link Google Drive tidak valid.\` }, { quoted: msg });
              }
          } catch (e) {
              console.error("GDrive error:", e);
              await this.sock.sendMessage(jid, { text: \`❌ Gagal memproses link gdrive.\` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".mediafire") || body.startsWith("mediafire")) {`
);


content = content.replace(
/    \} else if \(body\.startsWith\("\.mediafire"\) \|\| body\.startsWith\("mediafire"\)\) \{[\s\S]*?    \} else if \(body\.startsWith\("\.tiktok "\) \|\| body === "\.tiktok" \|\| body\.startsWith\("tiktok "\) \|\| body === "tiktok"\) \{/,
`    } else if (body.startsWith(".mediafire") || body.startsWith("mediafire")) {
      const urlMatches = messageContent.match(/(https?:\\/\\/[^\\s]+)/g);
      if (!urlMatches) {
          await this.sock.sendMessage(jid, { text: \`Kirim link Mediafire!\\nContoh: .mediafire https://www.mediafire.com/file/xxx\` }, { quoted: msg });
      } else {
          try {
              await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil info file Mediafire...*" }, { quoted: msg });
              const url = urlMatches[0];
              const cheerio = require('cheerio');
              const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
              const $ = cheerio.load(res.data);
              const downloadLink = $('#downloadButton').attr('href');
              
              if (downloadLink) {
                  const filename = $('.dl-btn-label').attr('title') || 'Mediafire_Download';
                  await this.sock.sendMessage(jid, { text: \`✅ Berhasil mendapatkan link Mediafire! Sedang mengirim file...\` }, { quoted: msg });
                  await this.sock.sendMessage(jid, { document: { url: downloadLink }, mimetype: 'application/octet-stream', fileName: filename }, { quoted: msg });
              } else {
                  await this.sock.sendMessage(jid, { text: \`❌ Tidak dapat menemukan link download Mediafire.\` }, { quoted: msg });
              }
          } catch (e) {
              console.error("Mediafire error:", e);
              await this.sock.sendMessage(jid, { text: \`❌ Gagal mendownload Mediafire.\` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".tiktok ") || body === ".tiktok" || body.startsWith("tiktok ") || body === "tiktok") {`
);


fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Updated!");
