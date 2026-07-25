const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/services/whatsapp.ts', 'utf8');

// Fix 440 reconnect issue without deleting session
code = code.replace(
    'if (statusCode === DisconnectReason.loggedOut || statusCode === 440) {',
    'if (statusCode === DisconnectReason.loggedOut) {'
);

code = code.replace(
    'if (statusCode === DisconnectReason.loggedOut) {',
    'if (statusCode === DisconnectReason.loggedOut) {\n             shouldReconnect = false;\n          } else if (statusCode === 440) {\n             shouldReconnect = false; // Do not reconnect on conflict, but do not delete session either\n             this.broadcastState("Conflict (440): Connected from another location. Stopping reconnect loop.");\n             this.updateStatus("disconnected");\n             return;\n          }'
);

// Fix AI hanging issue by adding timeout
code = code.replace(
    'const response = await axios.post(\'https://text.pollinations.ai/openai\', payload, {',
    'const response = await axios.post(\'https://text.pollinations.ai/openai\', payload, {\n                   timeout: 10000,'
);

code = code.replace(
    'const textRes = await axios.get(\'https://text.pollinations.ai/\'+encodeURIComponent(query), {',
    'const textRes = await axios.get(\'https://text.pollinations.ai/\'+encodeURIComponent(query), {\n                        timeout: 10000,'
);

fs.writeFileSync('/app/applet/src/services/whatsapp.ts', code);
console.log("Patched successfully!");
