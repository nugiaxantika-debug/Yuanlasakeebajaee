const fs = require('fs');
const path = require('path');

const danaPath = path.join(process.cwd(), 'public', 'templates', 'fakedana.png');
if (fs.existsSync(danaPath)) {
    const b64 = fs.readFileSync(danaPath).toString('base64');
    console.log("Length:", b64.length);
} else {
    console.log("Not found");
}
