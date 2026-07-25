const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `    } else {
        const cmdPrefixes = [".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai"];
        const firstWord = body.split(" ")[0].toLowerCase();
        
        if (cmdPrefixes.includes(firstWord)) {`;

const replacement = `    } else if ([".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai"].includes(body.split(" ")[0].toLowerCase())) {`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed brace!");
