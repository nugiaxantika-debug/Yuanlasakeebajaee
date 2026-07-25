const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex1 = /const totalFitur = ownerCommands\.length \+ groupCommands\.length \+ funCommands\.length \+ margaCommands\.length \+ videoCommands\.length \+ stickerCommands\.length \+ downloadCommands\.length \+ kristenCommands\.length \+ islamCommands\.length \+ cecanCommands\.length \+ primbonCommands\.length \+ animeCommands\.length \+ sertifikatCommands\.length \+ rpgCommands\.length \+ storeCommands\.length \+ beritaCommands\.length \+ sulapCommands\.length \+ hentaiCommands\.length \+ hantuCommands\.length;/g;

const regex2 = /const totalFitur = ownerCommands\.length \+ groupCommands\.length \+ margaCommands\.length \+ videoCommands\.length \+ stickerCommands\.length \+ funCommands\.length \+ downloadCommands\.length \+ kristenCommands\.length \+ islamCommands\.length \+ cecanCommands\.length \+ primbonCommands\.length \+ animeCommands\.length \+ sertifikatCommands\.length \+ rpgCommands\.length \+ storeCommands\.length \+ beritaCommands\.length \+ sulapCommands\.length \+ hentaiCommands\.length \+ hantuCommands\.length;/g;

let matches1 = code.match(regex1);
let matches2 = code.match(regex2);

console.log("matches1:", matches1 ? matches1.length : 0);
console.log("matches2:", matches2 ? matches2.length : 0);

if (matches1) {
  code = code.replace(regex1, "const totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length;");
}
if (matches2) {
  code = code.replace(regex2, "const totalFitur = ownerCommands.length + groupCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + funCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length;");
}

fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
console.log("Done updating totalFitur!");
