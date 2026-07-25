const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `const totalFitur = (ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length + deviceCommands.length + tiketCommands.length + karyawanCommands.length + hewanCommands.length + bokepCommands.length) / 2;`;
const replacementStr = `const totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length + deviceCommands.length + tiketCommands.length + karyawanCommands.length + hewanCommands.length + bokepCommands.length;`;

content = content.replace(targetStr, replacementStr);
content = content.replace(targetStr, replacementStr);

fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Success");
