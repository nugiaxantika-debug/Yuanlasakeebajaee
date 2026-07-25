import { GoogleGenAI } from "@google/genai";
let answer = "";
const genAiApiKey = process.env.GEMINI_API_KEY;
if (genAiApiKey && genAiApiKey.trim() !== "") {
    try {
      const ai = new GoogleGenAI({ apiKey: genAiApiKey });
      const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: "halo",
          config: { systemInstruction: "You are a helpful assistant." }
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
               { role: "system", content: "You are a helpful assistant." },
               { role: "user", content: "halo" }
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
       }
    } catch (e) {
       console.error("Third party AI error:", e);
    }
}
console.log("Final answer:", answer);
