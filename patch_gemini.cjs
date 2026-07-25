const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const target = `            try {
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
            }`;

const replacement = `            try {
              const { GoogleGenAI } = await import("@google/genai");
              const ai = new GoogleGenAI({ apiKey: genAiApiKey });
              const response = await ai.models.generateContent({
                  model: "gemini-1.5-flash-latest",
                  contents: query,
                  config: { systemInstruction: systemPrompt }
              });
              answer = response.text;
            } catch(e) {
                geminiError = e.message || String(e);
                console.error("Gemini API error, falling back:", e);
                try {
                  const { GoogleGenAI } = await import("@google/genai");
                  const ai = new GoogleGenAI({ apiKey: genAiApiKey });
                  const response = await ai.models.generateContent({
                      model: "gemini-1.5-flash-8b",
                      contents: query,
                      config: { systemInstruction: systemPrompt }
                  });
                  answer = response.text;
                  geminiError = "";
                } catch(e2) {
                    geminiError = e2.message || String(e2);
                    console.error("Gemini API error (fallback), giving up:", e2);
                    try {
                      const { GoogleGenAI } = await import("@google/genai");
                      const ai = new GoogleGenAI({ apiKey: genAiApiKey });
                      const response = await ai.models.generateContent({
                          model: "gemini-pro",
                          contents: query,
                          // gemini-pro does not support systemInstruction in the same way sometimes, but we try
                      });
                      answer = response.text;
                      geminiError = "";
                    } catch(e3) {
                       geminiError = e3.message || String(e3);
                       console.error("Gemini API error (fallback 3), giving up:", e3);
                    }
                }
            }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
