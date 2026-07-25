require('dotenv/config');

async function run() {
    const query = "halo";
    const systemPrompt = "You are an assistant.";
    const genAiApiKey = process.env.GEMINI_API_KEY;
    
    let answer = "";
    let geminiError = "";
    
    if (genAiApiKey && genAiApiKey.trim() !== "") {
        const modelsToTry = [
            "gemini-flash-latest",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-pro-latest",
            "gemini-1.5-pro-latest"
        ];
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: genAiApiKey });
        
        let lastError = null;
        for (const modelName of modelsToTry) {
            try {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: query,
                    config: { systemInstruction: systemPrompt }
                });
                answer = response.text;
                geminiError = "";
                lastError = null;
                console.log("Success with", modelName);
                break; 
            } catch(e) {
                lastError = e;
            }
        }
        if (lastError && !answer) {
            geminiError = lastError.message || String(lastError);
        }
    }
    
    console.log("Answer:", answer);
}
run();
