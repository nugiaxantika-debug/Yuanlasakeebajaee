const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/services/whatsapp.ts', 'utf8');

code = code.replace(
`          if (statusCode === DisconnectReason.loggedOut) {
             shouldReconnect = false;
          } else if (statusCode === 440) {
             shouldReconnect = false; // Do not reconnect on conflict, but do not delete session either
             this.broadcastState("Conflict (440): Connected from another location. Stopping reconnect loop.");
             this.updateStatus("disconnected");
             return;
          }
             shouldReconnect = false;
          }`,
`          if (statusCode === DisconnectReason.loggedOut) {
             shouldReconnect = false;
          } else if (statusCode === 440) {
             shouldReconnect = false; // Do not reconnect on conflict, but do not delete session either
             this.broadcastState("Conflict (440): Connected from another location. Stopping reconnect loop.");
             this.updateStatus("disconnected");
             return;
          }`
);

fs.writeFileSync('/app/applet/src/services/whatsapp.ts', code);
console.log("Patched successfully!");
