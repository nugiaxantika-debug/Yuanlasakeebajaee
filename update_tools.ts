import fs from 'fs';

let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

content = content.replace(
/    \} else if \(body\.startsWith\("\.ttsaudio"\) \|\| body\.startsWith\("ttsaudio"\)\) \{[\s\S]*?    \} else if \(body\.startsWith\("\.tiktokslide"\) \|\| body\.startsWith\("tiktokslide"\)\) \{/,
`    } else if (body.startsWith(".ttsaudio") || body.startsWith("ttsaudio")) {
      const text = messageContent.replace(/^\\.?ttsaudio\\s*/i, "").trim();
      if (!text) {
          await this.sock.sendMessage(jid, { text: \`Kirim teks untuk dijadikan audio!\\nContoh: .ttsaudio Halo semuanya\` }, { quoted: msg });
      } else {
          try {
              await this.sock.sendMessage(jid, { text: "⏳ *Sedang memproses TTS...*" }, { quoted: msg });
              const url = \`https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=id&q=\${encodeURIComponent(text)}\`;
              await this.sock.sendMessage(jid, { audio: { url: url }, mimetype: 'audio/mpeg' }, { quoted: msg });
          } catch (e) {
              console.error("TTS error:", e);
              await this.sock.sendMessage(jid, { text: \`❌ Gagal membuat TTS audio.\` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".tiktokslide") || body.startsWith("tiktokslide")) {`
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
              const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
              
              const match = res.data.match(/href="(https?:\\/\\/download\\d+\\.mediafire\\.com[^"]+)"/);
              let downloadLink = match ? match[1] : null;
              
              if (!downloadLink) {
                 const match2 = res.data.match(/id="downloadButton" href="([^"]+)"/);
                 downloadLink = match2 ? match2[1] : null;
              }
              
              if (downloadLink) {
                  const filenameMatch = res.data.match(/class="dl-btn-label" title="([^"]+)"/);
                  const filename = filenameMatch ? filenameMatch[1] : 'Mediafire_Download';
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
