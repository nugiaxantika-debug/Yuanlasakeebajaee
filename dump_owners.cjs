const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.startsWith('bot_settings_'));
files.forEach(f => {
    console.log("File:", f);
    console.log(fs.readFileSync(f, 'utf8'));
});
