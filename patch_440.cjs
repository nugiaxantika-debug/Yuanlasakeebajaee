const fs = require('fs');
const file = '/app/applet/src/services/whatsapp.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    'if (statusCode === DisconnectReason.loggedOut) {',
    'if (statusCode === DisconnectReason.loggedOut || statusCode === 440) {'
);

fs.writeFileSync(file, code);
console.log("Patched 440");
