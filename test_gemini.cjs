require('dotenv/config');
async function test() {
    try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: "halo",
            config: { systemInstruction: "You are AI" }
        });
        console.log("Success:", response.text);
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
