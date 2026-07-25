const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

function fixCommand(commandRegex) {
    let match = code.match(commandRegex);
    if (match) {
        let block = match[0];
        block = block.replace(
            /targetJid = this\.normalizeJid\(args \+ "@s\.whatsapp\.net"\);/g,
            `targetJid = this.normalizeJid(args.includes("@lid") ? args : args + "@s.whatsapp.net");`
        );
        code = code.replace(commandRegex, block);
    }
}

fixCommand(/\} else if \(body\.startsWith\("\.addowner"\) \|\| body\.startsWith\("addowner"\)\) \{[\s\S]*?this\.saveBotSettings\(\);[\s\S]*?\}/);
fixCommand(/\} else if \(body\.startsWith\("\.delowner"\) \|\| body\.startsWith\("delowner"\)\) \{[\s\S]*?this\.saveBotSettings\(\);[\s\S]*?\}/);
fixCommand(/\} else if \(body\.startsWith\("\.addpremium"\)[\s\S]*?this\.saveBotSettings\(\);[\s\S]*?\}/);
fixCommand(/\} else if \(body\.startsWith\("\.delpremium"\)[\s\S]*?this\.saveBotSettings\(\);[\s\S]*?\}/);

fs.writeFileSync('src/services/whatsapp.ts', code);
console.log("Fixed targetJid for args");
