const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetRegex = /try \{\s+const \{ GoogleGenAI \} = await import\("@google\/genai"\);\s+const ai = new GoogleGenAI\(\{ apiKey: genAiApiKey \}\);\s+const response = await ai\.models\.generateContent\(\{[\s\S]*?geminiError = e3\.message \|\| String\(e3\);\s+console\.error\("Gemini API error \(fallback 3\), giving up:", e3\);\s+\}\s+\}\s+\}/;

const replacement = `            const modelsToTry = [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-1.5-flash-8b",
                "gemini-1.5-pro",
                "gemini-pro",
                "gemini-1.0-pro"
            ];
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: genAiApiKey });
            
            let lastError = null;
            for (const modelName of modelsToTry) {
                try {
                    const response = await ai.models.generateContent({
                        model: modelName,
                        contents: query,
                        // Hanya beberapa model yang support systemInstruction, tapi SDK biasanya mengabaikannya jika tidak disupport
                        config: { systemInstruction: systemPrompt }
                    });
                    answer = response.text;
                    geminiError = "";
                    lastError = null;
                    break; // Berhasil, keluar dari loop
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
