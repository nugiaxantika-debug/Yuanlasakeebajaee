const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const hentaiCommandsDef = `    const hentaiCommands = ['.hentaimenu', 'hentaimenu', '.hentai', 'hentai', '.nsfw', 'nsfw', '.nsfwahegao', 'nsfwahegao', '.nsfwass', 'nsfwass', '.nsfwbdsm', 'nsfwbdsm', '.nsfwgangbang', 'nsfwgangbang', '.nsfwgay', 'nsfwgay', '.nsfwloli', 'nsfwloli', '.nsfwneko', 'nsfwneko', '.nsfwpussy', 'nsfwpussy', '.nsfwzettai', 'nsfwzettai'];\n`;
const hantuCommandsDef = `    const hantuCommands = ['.hantumenu', 'hantumenu', '.fotpocong', 'fotpocong', '.fotkuntilanak', 'fotkuntilanak', '.fotgenderuwo', 'fotgenderuwo', '.fotwewegombel', 'fotwewegombel', '.fottuyul', 'fottuyul', '.fotsundelbolong', 'fotsundelbolong', '.fotpalasik', 'fotpalasik', '.fotkuyang', 'fotkuyang', '.fotbanaspati', 'fotbanaspati', '.fotjelangkung', 'fotjelangkung', '.fotsiluman', 'fotsiluman', '.fotnyirorokidul', 'fotnyirorokidul', '.fotgundulpringis', 'fotgundulpringis'];\n`;

code = code.replace(
  `    const sulapCommands = ['.sulapmenu', 'sulapmenu'`,
  hentaiCommandsDef + hantuCommandsDef + `    const sulapCommands = ['.sulapmenu', 'sulapmenu'`
);

code = code.replace(
  `totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length;`,
  `totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length;`
);

code = code.replace(
  `totalFitur = ownerCommands.length + groupCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + funCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length;`,
  `totalFitur = ownerCommands.length + groupCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + funCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length;`
);

// add to allmenu
code = code.replace(
  `│ .rpgmenu\n│ .storemenu\n│ .beritamenu\n│ .sulapmenu\nKetik menu yang kamu inginkan.`,
  `│ .rpgmenu\n│ .storemenu\n│ .beritamenu\n│ .sulapmenu\n│ .hentaimenu\n│ .hantumenu\nKetik menu yang kamu inginkan.`
);

fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
