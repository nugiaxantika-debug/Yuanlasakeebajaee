const query = "halo";
const systemPrompt = "You are a helpful assistant.";

async function run() {
  let answer = "";
  const genAiApiKey = process.env.GEMINI_API_KEY;
  console.log("Key:", genAiApiKey ? "Exists" : "Empty");
  if (genAiApiKey && genAiApiKey.trim() !== "") {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: genAiApiKey });
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: query,
            config: { systemInstruction: systemPrompt }
        });
        answer = response.text;
      } catch(e) {
          console.error("Gemini API error, falling back:", e.message);
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
                const textRes = await fetch('https://text.pollinations.ai/'+encodeURIComponent(query));
                if (textRes.ok) answer = await textRes.text();
             }
         } else {
             const errText = await response.text();
             console.error("Pollinations error:", response.status, errText);
             answer = "❌ Gagal mendapatkan respon dari AI (Status: " + response.status + ")";
         }
      } catch (e) {
         console.error("Third party AI error:", e.message);
         answer = "❌ Gagal menghubungi layanan AI pihak ketiga.";
      }
  }

  console.log("Answer:", answer);
}
run();
