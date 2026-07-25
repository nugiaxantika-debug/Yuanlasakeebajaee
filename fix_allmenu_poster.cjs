const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// The script previously tried to replace `│ .hantumenu\nKetik menu yang kamu inginkan.`
// Let's check how the all menu looks like currently.
const match = code.match(/│ \.hantumenu[^\`]+/);
if (match) {
    console.log("Current tail of all menu:", JSON.stringify(match[0]));
} else {
    console.log("Could not find hantumenu in allmenu string.");
}
