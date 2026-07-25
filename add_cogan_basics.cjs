const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// 1. Add coganmenu commands array
if (!code.includes('const coganCommands =')) {
    const coganArr = "const coganCommands = ['.coganmenu', 'coganmenu', '.coganiqbaal', 'coganiqbaal', '.coganjefrinichol', 'coganjefrinichol', '.coganangga', 'coganangga', '.coganverrell', 'coganverrell', '.coganrizky', 'coganrizky', '.coganjepang', 'coganjepang', '.cogankorea', 'cogankorea', '.coganthailand', 'coganthailand', '.coganchina', 'coganchina', '.cogandenji', 'cogandenji', '.cogangojo', 'cogangojo', '.coganlevi', 'coganlevi', '.coganluffy', 'coganluffy', '.cogansasuke', 'cogansasuke', '.cogannaruto', 'cogannaruto', '.cogankakashi', 'cogankakashi'];";
    code = code.replace("const posterCommands =", coganArr + "\n    const posterCommands =");
    
    // 2. update totalFitur calculation
    code = code.replace(
      "const totalFitur = infoCommands.length + islamCommands.length + downloaderCommands.length + aiCommands.length + searchCommands.length + groupCommands.length + gameCommands.length + toolsCommands.length + makerCommands.length + rpgCommands.length + beritaCommands.length + storeCommands.length + hentaiCommands.length + hantuCommands.length + sulapCommands.length + posterCommands.length;",
      "const totalFitur = infoCommands.length + islamCommands.length + downloaderCommands.length + aiCommands.length + searchCommands.length + groupCommands.length + gameCommands.length + toolsCommands.length + makerCommands.length + rpgCommands.length + beritaCommands.length + storeCommands.length + hentaiCommands.length + hantuCommands.length + sulapCommands.length + posterCommands.length + coganCommands.length;"
    );
    
    // 3. update allmenu string
    code = code.replace(
      "│ .postermenu\n\nKetik menu yang kamu inginkan.",
      "│ .postermenu\n│ .coganmenu\n\nKetik menu yang kamu inginkan."
    );
    
    fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
    console.log("Added coganmenu basics!");
} else {
    console.log("Already has coganmenu basics");
}
