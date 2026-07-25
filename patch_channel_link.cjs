const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// 1. Add property
if (!content.includes('private channelLink: string | null')) {
    content = content.replace(
        'private menuLink: string | null = "jadibotbatakvip.biz.id";',
        'private menuLink: string | null = "jadibotbatakvip.biz.id";\n  private channelLink: string | null = null;'
    );
}

// 2. Add to loadBotSettings
if (!content.includes('if (obj.channelLink !== undefined) this.channelLink = obj.channelLink;')) {
    content = content.replace(
        'if (obj.menuLink !== undefined) this.menuLink = obj.menuLink;',
        'if (obj.menuLink !== undefined) this.menuLink = obj.menuLink;\n      if (obj.channelLink !== undefined) this.channelLink = obj.channelLink;'
    );
}

// 3. Add to saveBotSettings
if (!content.includes('channelLink: this.channelLink')) {
    content = content.replace(
        'menuLink: this.menuLink',
        'menuLink: this.menuLink,\n      channelLink: this.channelLink'
    );
}

// 4. Add to ownerCommands array
if (!content.includes("'chasetlink'")) {
    content = content.replace(
        "'.linkset', 'linkset', '.dellinkset', 'dellinkset'",
        "'.linkset', 'linkset', '.dellinkset', 'dellinkset', '.chasetlink', 'chasetlink', '.delchasetlink', 'delchasetlink'"
    );
}
// Also in the text menu for ownermenu
if (!content.includes('│ .chasetlink')) {
    content = content.replace(
        '│ .linkset\n│ .dellinkset',
        '│ .linkset\n│ .dellinkset\n│ .chasetlink\n│ .delchasetlink'
    );
}

fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Patched 1 to 4");
