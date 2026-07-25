require('dotenv/config');

async function test() {
    const modelsToTry = [
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ];
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    for (const modelName of modelsToTry) {
        try {
            console.log("Trying", modelName);
            const response = await ai.models.generateContent({
                model: modelName,
                contents: "halo",
                config: { systemInstruction: "You are a helpful assistant." }
            });
            console.log("Success with", modelName, ":", response.text.substring(0, 50));
            break;
        } catch(e) {
            console.error("Failed", modelName, ":", e.message);
        }
    }
}
test();
