const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetRegex = /let answer = "";\s+const genAiApiKey = process\.env\.GEMINI_API_KEY;\s+if \(genAiApiKey && genAiApiKey\.trim\(\) !== ""\) \{[\s\S]*?if \(!answer\) \{\s+if \(!process\.env\.GEMINI_API_KEY\) \{[\s\S]*?\} else \{\s+answer = "❌ Gagal mendapatkan respon dari AI\. API key mungkin tidak valid atau limit habis\.";\s+\}\s+\}\s+\}/;

const replacement = `let answer = "";
        let geminiError = "";
        const genAiApiKey = process.env.GEMINI_API_KEY;
        
        if (genAiApiKey && genAiApiKey.trim() !== "") {
            try {
              const { GoogleGenAI } = await import("@google/genai");
              const ai = new GoogleGenAI({ apiKey: genAiApiKey });
              const response = await ai.models.generateContent({
                  model: "gemini-2.5-flash",
                  contents: query,
                  config: { systemInstruction: systemPrompt }
              });
              answer = response.text;
            } catch(e) {
                geminiError = e.message || String(e);
                console.error("Gemini API error, falling back:", e);
                // Coba model lama jika 2.5 gagal (kadang API key lama tidak support model terbaru)
                try {
                  const { GoogleGenAI } = await import("@google/genai");
                  const ai = new GoogleGenAI({ apiKey: genAiApiKey });
                  const response = await ai.models.generateContent({
                      model: "gemini-1.5-flash",
                      contents: query,
                      config: { systemInstruction: systemPrompt }
                  });
                  answer = response.text;
                  geminiError = ""; // Berhasil di fallback
                } catch(e2) {
                    geminiError = e2.message || String(e2);
                    console.error("Gemini API error (fallback), giving up:", e2);
                }
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
               const response = await axios.post('https://text.pollinations.ai/openai', payload, {
                   headers: {
                      'Content-Type': 'application/json',
                      'User-Agent': 'Mozilla/5.0'
                   }
               });
               if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                   answer = response.data.choices[0].message.content;
               }
            } catch (e) {
               console.error("Pollinations OpenAI error:", e.message);
            }
            
            if (!answer) {
                try {
                    const textRes = await axios.get('https://text.pollinations.ai/'+encodeURIComponent(query), {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (textRes.data) {
                        answer = typeof textRes.data === 'string' ? textRes.data : JSON.stringify(textRes.data);
                    }
                } catch (e2) {
                    console.error("Pollinations Text error:", e2.message);
                }
            }
            if (!answer) {
                if (!process.env.GEMINI_API_KEY) {
                    answer = "❌ *Gagal mendapatkan respon AI.*\\n\\nKarena API gratis sedang gangguan (IP diblokir), kamu *WAJIB* menambahkan \`GEMINI_API_KEY\` di Environment Variables Railway agar fitur AI berfungsi normal.";
                } else {
                    answer = \`❌ *Gagal mendapatkan respon AI.*\\n\\nAPI Key Gemini kamu terdeteksi, namun terjadi error saat menghubungi Google: _\${geminiError}_\` + "\\n\\nPastikan API Key kamu benar, masih aktif, dan memiliki kuota di Google AI Studio.";
                }
            }
        }`;

if (targetRegex.test(code)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
