const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const cmdPrefixesOld = `} else if ([".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai", ".nanobananaai", "nanobananaai"].includes(body.split(" ")[0].toLowerCase())) {`;
const cmdPrefixesNew = `} else if ([".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai"].includes(body.split(" ")[0].toLowerCase())) {`;

code = code.replace(cmdPrefixesOld, cmdPrefixesNew);

const imgPrefixesOld = `    } else if (body.startsWith(".imgai ") || body.startsWith("imgai ") ||
               body.startsWith(".bingimg ") || body.startsWith("bingimg ")) {`;
const imgPrefixesNew = `    } else if (body.startsWith(".imgai ") || body.startsWith("imgai ") ||
               body.startsWith(".bingimg ") || body.startsWith("bingimg ") ||
               body.startsWith(".nanobananaai ") || body.startsWith("nanobananaai ")) {`;

code = code.replace(imgPrefixesOld, imgPrefixesNew);

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed nanobananaai");
