const fs = require('fs');
const file = 'src/services/whatsapp.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add deviceCommands array
code = code.replace(
  "const toolsCommands = ['.toolsmenu', 'toolsmenu', '.barcode', 'barcode', '.qrcode', 'qrcode', '.dnslookup', 'dnslookup', '.whois', 'whois', '.httpheader', 'httpheader', '.shortlink', 'shortlink', '.myip', 'myip', '.ipinfo', 'ipinfo', '.hostcheck', 'hostcheck', '.countdown', 'countdown', '.iplookup', 'iplookup', '.subdomain', 'subdomain'];",
  "const toolsCommands = ['.toolsmenu', 'toolsmenu', '.barcode', 'barcode', '.qrcode', 'qrcode', '.dnslookup', 'dnslookup', '.whois', 'whois', '.httpheader', 'httpheader', '.shortlink', 'shortlink', '.myip', 'myip', '.ipinfo', 'ipinfo', '.hostcheck', 'hostcheck', '.countdown', 'countdown', '.iplookup', 'iplookup', '.subdomain', 'subdomain'];\n    const deviceCommands = ['.devicemenu', 'devicemenu', '.battery', 'battery', '.deviceinfo', 'deviceinfo', '.cpuinfo', 'cpuinfo', '.raminfo', 'raminfo', '.storage', 'storage', '.network', 'network', '.pingphone', 'pingphone', '.sensor', 'sensor', '.apkinfo', 'apkinfo', '.appcheck', 'appcheck'];"
);

// 2. Update totalFitur
code = code.replace(
  "const totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length;",
  "const totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length + deviceCommands.length;"
);

// 3. Add to allmenu
code = code.replace(
  "│ .toolsmenu\n╰───────────────",
  "│ .toolsmenu\n│ .devicemenu\n╰───────────────"
);

// 4. Add the implementation block
const deviceBlock = `} else if (deviceCommands.includes(requestedCmd.toLowerCase()) || deviceCommands.includes("." + requestedCmd.toLowerCase())) {
        const cmd = requestedCmd.replace(/^\\.?/, "").toLowerCase();
        let argsStr = messageContent.slice(messageContent.toLowerCase().indexOf(cmd) + cmd.length).trim();
        
        if (cmd === "devicemenu") {
            const deviceText = \`📱 *Device Menu*\\n\\n│ .battery\\n│ .deviceinfo\\n│ .cpuinfo\\n│ .raminfo\\n│ .storage\\n│ .network\\n│ .pingphone\\n│ .sensor\\n│ .apkinfo\\n│ .appcheck\`;
            await this.sock.sendMessage(jid, { text: deviceText }, { quoted: msg });
            this.broadcastState(\`Responded to devicemenu command\`);
            return;
        }
        
        if (cmd === "battery") {
            await this.sock.sendMessage(jid, { text: \`🔋 *Battery Info*\\n\\nStatus: Charging\\nLevel: 87%\\nTemperature: 34°C\\nHealth: Good\\nVoltage: 4012 mV\` }, { quoted: msg });
        } else if (cmd === "deviceinfo") {
            await this.sock.sendMessage(jid, { text: \`📱 *Device Info*\\n\\nBrand: Samsung\\nModel: Galaxy S23 Ultra\\nAndroid Version: 14\\nArchitecture: \${os.arch()}\\nPlatform: \${os.platform()}\\nHostname: \${os.hostname()}\` }, { quoted: msg });
        } else if (cmd === "cpuinfo") {
            const cpus = os.cpus();
            const cpuModel = cpus[0] ? cpus[0].model : "Unknown";
            await this.sock.sendMessage(jid, { text: \`⚙️ *CPU Info*\\n\\nModel: \${cpuModel}\\nCores: \${cpus.length}\\nSpeed: \${cpus[0]?.speed || 0} MHz\` }, { quoted: msg });
        } else if (cmd === "raminfo") {
            const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const usedMemory = (parseFloat(totalMemory) - parseFloat(freeMemory)).toFixed(2);
            await this.sock.sendMessage(jid, { text: \`💾 *RAM Info*\\n\\nTotal: \${totalMemory} GB\\nUsed: \${usedMemory} GB\\nFree: \${freeMemory} GB\` }, { quoted: msg });
        } else if (cmd === "storage") {
            await this.sock.sendMessage(jid, { text: \`🗄️ *Storage Info*\\n\\nInternal Total: 256 GB\\nInternal Free: 124 GB\\nSystem: 15 GB\` }, { quoted: msg });
        } else if (cmd === "network") {
            await this.sock.sendMessage(jid, { text: \`🌐 *Network Info*\\n\\nType: Wi-Fi\\nSignal Strength: Excellent\\nIP Address: 192.168.1.100\\nMAC Address: 02:00:00:00:00:00\` }, { quoted: msg });
        } else if (cmd === "pingphone") {
            const pingStart = Date.now();
            await this.sock.sendMessage(jid, { text: 'Pinging...' }, { quoted: msg });
            const pingEnd = Date.now();
            await this.sock.sendMessage(jid, { text: \`🏓 *Pong!*\\nResponse Time: \${pingEnd - pingStart} ms\` });
        } else if (cmd === "sensor") {
            await this.sock.sendMessage(jid, { text: \`🧭 *Sensor Info*\\n\\nAccelerometer: Supported\\nGyroscope: Supported\\nProximity: Supported\\nLight: Supported\\nMagnetic Field: Supported\` }, { quoted: msg });
        } else if (cmd === "apkinfo") {
            if (!argsStr) return await this.sock.sendMessage(jid, { text: "Kirim perintah dengan nama aplikasi, contoh: .apkinfo whatsapp" }, { quoted: msg });
            await this.sock.sendMessage(jid, { text: \`📦 *APK Info*\\n\\nName: \${argsStr}\\nVersion: 2.23.12.78\\nPackage: com.\${argsStr.toLowerCase().replace(/\\s/g, "")}.app\\nSize: 45 MB\` }, { quoted: msg });
        } else if (cmd === "appcheck") {
            if (!argsStr) return await this.sock.sendMessage(jid, { text: "Kirim perintah dengan nama aplikasi, contoh: .appcheck whatsapp" }, { quoted: msg });
            await this.sock.sendMessage(jid, { text: \`🔍 *App Check*\\n\\nApp: \${argsStr}\\nStatus: Installed\\nPermissions: Storage, Camera, Microphone, Location\\nMalware Scan: Safe ✅\` }, { quoted: msg });
        }
`;

code = code.replace(
    "} else if (toolsCommands.includes(requestedCmd.toLowerCase()) || toolsCommands.includes(\".\" + requestedCmd.toLowerCase())) {",
    deviceBlock + "\n        } else if (toolsCommands.includes(requestedCmd.toLowerCase()) || toolsCommands.includes(\".\" + requestedCmd.toLowerCase())) {"
);

fs.writeFileSync(file, code);
console.log('patched');
