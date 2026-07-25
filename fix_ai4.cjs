const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const aiCommandsOld = `const aiCommands = ['.aimenu', 'aimenu', '.gpt4', 'gpt4', '.gemini', 'gemini', '.deepseek', 'deepseek', '.ai', 'ai', '.bing', 'bing', '.imgai', 'imgai', '.askai', 'askai', '.bingimg', 'bingimg'];`;
const aiCommandsNew = `const aiCommands = ['.aimenu', 'aimenu', '.gpt4', 'gpt4', '.gemini', 'gemini', '.deepseek', 'deepseek', '.ai', 'ai', '.bing', 'bing', '.imgai', 'imgai', '.askai', 'askai', '.bingimg', 'bingimg', '.nanobananaai', 'nanobananaai', '.hapusbgfoto', 'hapusbgfoto'];`;

if (code.includes(aiCommandsOld)) {
  code = code.replace(aiCommandsOld, aiCommandsNew);
} else {
  console.log("aiCommands array not found or already modified");
}

const aiTextOld = `      const aiText = \`🤖 *AI Menu*

│ .gpt4 <teks>
│ .gemini <teks>
│ .deepseek <teks>
│ .ai <teks>
│ .bing <teks>
│ .imgai <prompt>
│ .askai <teks>
│ .bingimg <prompt>\`;`;
const aiTextNew = `      const aiText = \`🤖 *AI Menu*

│ .gpt4 <teks>
│ .gemini <teks>
│ .deepseek <teks>
│ .ai <teks>
│ .bing <teks>
│ .imgai <prompt>
│ .askai <teks>
│ .bingimg <prompt>
│ .nanobananaai <teks>
│ .hapusbgfoto <reply/kirim foto>\`;`;

if (code.includes(aiTextOld)) {
  code = code.replace(aiTextOld, aiTextNew);
} else {
  console.log("aiText not found");
}

const cmdPrefixesOld = `} else if ([".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai"].includes(body.split(" ")[0].toLowerCase())) {`;
const cmdPrefixesNew = `} else if ([".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai", ".nanobananaai", "nanobananaai"].includes(body.split(" ")[0].toLowerCase())) {`;

if (code.includes(cmdPrefixesOld)) {
  code = code.replace(cmdPrefixesOld, cmdPrefixesNew);
} else {
  console.log("cmdPrefixes check not found");
}

const gpt4CheckOld = `        if (cmd === "gpt4") systemPrompt = "You are GPT-4, a large language model trained by OpenAI.";
        if (cmd === "gemini") systemPrompt = "You are Gemini, a powerful AI model created by Google.";
        if (cmd === "deepseek") systemPrompt = "You are DeepSeek, an AI model created by DeepSeek AI.";
        if (cmd === "bing") systemPrompt = "You are Bing AI, an AI assistant created by Microsoft.";`;
const gpt4CheckNew = `        if (cmd === "gpt4") systemPrompt = "You are GPT-4, a large language model trained by OpenAI.";
        if (cmd === "gemini") systemPrompt = "You are Gemini, a powerful AI model created by Google.";
        if (cmd === "deepseek") systemPrompt = "You are DeepSeek, an AI model created by DeepSeek AI.";
        if (cmd === "bing") systemPrompt = "You are Bing AI, an AI assistant created by Microsoft.";
        if (cmd === "nanobananaai") systemPrompt = "You are NanoBanana AI, a highly advanced assistant.";`;

if (code.includes(gpt4CheckOld)) {
  code = code.replace(gpt4CheckOld, gpt4CheckNew);
} else {
  console.log("systemPrompt check not found");
}

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Modifications applied");
