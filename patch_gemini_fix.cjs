const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetRegex = /const modelsToTry = \[[\s\S]*?console\.error\("Gemini API completely failed\. Last error:", geminiError\);\s+\}/;

const replacement = `            const modelsToTry = [
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
                        // Beberapa model lama tidak menerima config.systemInstruction, tapi @google/genai biasanya menyesuaikan
                        config: { systemInstruction: systemPrompt }
                    });
                    answer = response.text;
                    geminiError = "";
                    lastError = null;
                    break; 
                } catch(e) {
                    lastError = e;
                    console.error(\`Gemini API error with \${modelName}:\`, e.message);
                }
            }
            if (lastError && !answer) {
                geminiError = lastError.message || String(lastError);
                console.error("Gemini API completely failed. Last error:", geminiError);
            }`;

if (targetRegex.test(code)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
