const axios = require('axios');
require('dotenv/config');

async function test() {
    try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Buatkan saya website HTML lengkap dengan CSS",
            config: { systemInstruction: "You are a helpful assistant." }
        });
        console.log("Success:", response.text.substring(0, 100));
    } catch (e) {
        console.log("Error:", e.message, e.response?.data);
    }
}
test();
