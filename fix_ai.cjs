const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStart = `      if (queries[q]) {
        await this.sock.sendMessage(jid, { text: \`⏳ *Sedang mencari foto cecan \${q}...*\` }, { quoted: msg });
        try {`;
const targetEnd = `               answer = "❌ Gagal menghubungi layanan AI pihak ketiga.";
            }
        }`;

const idxStart = code.indexOf(targetStart);
const idxEnd = code.indexOf(targetEnd, idxStart) + targetEnd.length;

if (idxStart === -1 || idxEnd === -1) {
    console.error("Could not find bounds");
    process.exit(1);
}

const replacement = `      if (queries[q]) {
        await this.sock.sendMessage(jid, { text: \`⏳ *Sedang mencari foto cecan \${q}...*\` }, { quoted: msg });
        try {
           const p = await ab.pinterest(queries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: \`📸 *Cecan \${q.charAt(0).toUpperCase() + q.slice(1)}*\` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: \`❌ *Foto cecan \${q} tidak ditemukan.*\` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      }
    
    } else if (body === "aimenu" || body === ".aimenu" || body === "ai menu" || body === ".ai menu") {
      const aiText = \`🤖 *AI Menu*

│ .gpt4 <teks>
│ .gemini <teks>
│ .deepseek <teks>
│ .ai <teks>
│ .bing <teks>
│ .imgai <prompt>
│ .askai <teks>
│ .bingimg <prompt>\`;
      await this.sock.sendMessage(jid, { text: aiText }, { quoted: msg });
      this.broadcastState(\`Responded to aimenu command\`);
    } else if (body === "bokepmenu" || body === ".bokepmenu" || body === "bokep menu" || body === ".bokep menu") {
      const bokepText = \`🔞 *Bokep Menu*

│ .vidbokepindonesia
│ .vidbokepmalaysia
│ .vidbokepjepang
│ .vidbokepchina
│ .vidbokepamerika\`;
      await this.sock.sendMessage(jid, { text: bokepText }, { quoted: msg });
      this.broadcastState(\`Responded to bokepmenu command\`);
    
    } else {
        const cmdPrefixes = [".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai"];
        const firstWord = body.split(" ")[0].toLowerCase();
        
        if (cmdPrefixes.includes(firstWord)) {
      
      const args = body.split(" ");
      const cmd = args[0].replace(".", "").toLowerCase();
      const query = body.substring(args[0].length).trim();
      
      if (!query) {
        // Return without failing
        this.sock.sendMessage(jid, { text: \`⚠️ Format salah! Gunakan: .\${cmd} <pertanyaan>\` }, { quoted: msg }).catch(()=>{});
        return;
      }
      
      await this.sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
      
      try {
        let systemPrompt = "You are a helpful assistant.";
        if (cmd === "gpt4") systemPrompt = "You are GPT-4, a large language model trained by OpenAI.";
        if (cmd === "gemini") systemPrompt = "You are Gemini, a powerful AI model created by Google.";
        if (cmd === "deepseek") systemPrompt = "You are DeepSeek, an AI model created by DeepSeek AI.";
        if (cmd === "bing") systemPrompt = "You are Bing AI, an AI assistant created by Microsoft.";
        
        let answer = "";
        const genAiApiKey = process.env.GEMINI_API_KEY;
        
        if (genAiApiKey && genAiApiKey.trim() !== "") {
            try {
              const { GoogleGenAI } = await import("@google/genai");
              const ai = new GoogleGenAI({ apiKey: genAiApiKey });
              const response = await ai.models.generateContent({
                  model: "gemini-2.0-flash",
                  contents: query,
                  config: { systemInstruction: systemPrompt }
              });
              answer = response.text;
            } catch(e) {
                console.error("Gemini API error, falling back:", e);
            }
        }
        
        if (!answer) {
            try {
               const payload = {
                   model: "openai",
                   messages: [
                       { role: "system", content: systemPrompt },
                       { role: "user", content: query }
                   ]
               };
               const response = await fetch('https://text.pollinations.ai/openai', {
                   method: 'POST',
                   headers: {
                      'Content-Type': 'application/json',
                     'User-Agent': 'Mozilla/5.0'
                   },
                   body: JSON.stringify(payload)
               });
               if (response.ok) {
                   const data = await response.json();
                   answer = data?.choices?.[0]?.message?.content;
                   if (!answer) {
                      // Fallback to text prompt api
                      const textRes = await fetch('https://text.pollinations.ai/'+encodeURIComponent(query));
                      if (textRes.ok) answer = await textRes.text();
                   }
               } else {
                   const errText = await response.text();
                   console.error("Pollinations error:", response.status, errText);
                   answer = "❌ Gagal mendapatkan respon dari AI (Status: " + response.status + ")";
               }
            } catch (e) {
               console.error("Third party AI error:", e);
               answer = "❌ Gagal menghubungi layanan AI pihak ketiga.";
            }
        }`;

code = code.substring(0, idxStart) + replacement + code.substring(idxEnd);
fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed!");
