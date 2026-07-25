const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// 1. Add postermenu commands array
if (!code.includes('const posterCommands =')) {
    const posterArr = "const posterCommands = ['.postermenu', 'postermenu', '.pengabdisetan', 'pengabdisetan', '.kkndidesapenari', 'kkndidesapenari', '.sewudino', 'sewudino', '.impetigore', 'impetigore', '.rumahdara', 'rumahdara', '.qodrat', 'qodrat', '.kuntilanak', 'kuntilanak', '.jelangkung', 'jelangkung', '.keramat', 'keramat', '.suzzanna', 'suzzanna', '.mangkujiwo', 'mangkujiwo', '.losmenmelati', 'losmenmelati'];";
    code = code.replace("const sulapCommands =", posterArr + "\n    const sulapCommands =");
    
    // 2. update totalFitur calculation
    code = code.replace(
      "const totalFitur = infoCommands.length + islamCommands.length + downloaderCommands.length + aiCommands.length + searchCommands.length + groupCommands.length + gameCommands.length + toolsCommands.length + makerCommands.length + rpgCommands.length + beritaCommands.length + storeCommands.length + hentaiCommands.length + hantuCommands.length + sulapCommands.length;",
      "const totalFitur = infoCommands.length + islamCommands.length + downloaderCommands.length + aiCommands.length + searchCommands.length + groupCommands.length + gameCommands.length + toolsCommands.length + makerCommands.length + rpgCommands.length + beritaCommands.length + storeCommands.length + hentaiCommands.length + hantuCommands.length + sulapCommands.length + posterCommands.length;"
    );
    
    // 3. update allmenu string
    code = code.replace(
      "│ .hantumenu\nKetik menu yang kamu inginkan.",
      "│ .hantumenu\n│ .postermenu\nKetik menu yang kamu inginkan."
    );
    
    fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
    console.log("Added postermenu basics!");
}
