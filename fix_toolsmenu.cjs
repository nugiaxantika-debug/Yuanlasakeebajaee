const fs = require('fs');

const filePath = 'src/services/whatsapp.ts';
let code = fs.readFileSync(filePath, 'utf8');

const toolsLogic = `
    } else if (toolsCommands.includes(requestedCmd.toLowerCase()) || toolsCommands.includes("." + requestedCmd.toLowerCase())) {
        const cmd = requestedCmd.replace(/^\\.?/, "").toLowerCase();
        let argsStr = messageContent.slice(messageContent.toLowerCase().indexOf(cmd) + cmd.length).trim();
        
        if (cmd === "toolsmenu") {
            const toolsText = \`🛠️ *Tools Menu*\\n\\n│ .barcode\\n│ .qrcode\\n│ .dnslookup\\n│ .whois\\n\\n│ .httpheader\\n│ .shortlink\\n│ .myip\\n│ .ipinfo\\n│ .hostcheck\\n│ .countdown\\n│ .iplookup\\n│ .subdomain\`;
            await this.sock.sendMessage(jid, { text: toolsText }, { quoted: msg });
            this.broadcastState(\`Responded to toolsmenu command\`);
            return;
        }

        if (cmd === "myip") {
            try {
                const { data } = await axios.get("https://api.ipify.org?format=json");
                await this.sock.sendMessage(jid, { text: \`🖥️ *Bot IP:* \${data.ip}\` }, { quoted: msg });
            } catch (e) {
                await this.sock.sendMessage(jid, { text: "❌ *Gagal mendapatkan IP.*" }, { quoted: msg });
            }
            return;
        }

        if (!argsStr && cmd !== "myip") {
            await this.sock.sendMessage(jid, { text: \`Masukkan parameter!\\nContoh: .\${cmd} text_atau_url\` }, { quoted: msg });
            return;
        }

        try {
            await this.sock.sendMessage(jid, { text: \`⏳ *Memproses \${cmd}...*\` }, { quoted: msg });
            switch (cmd) {
                case "barcode":
                    const bcUrl = \`https://barcodeapi.org/api/auto/\${encodeURIComponent(argsStr)}\`;
                    await this.sock.sendMessage(jid, { image: { url: bcUrl }, caption: \`🏷️ *Barcode:*\\n\${argsStr}\` }, { quoted: msg });
                    break;
                case "qrcode":
                    const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=\${encodeURIComponent(argsStr)}\`;
                    await this.sock.sendMessage(jid, { image: { url: qrUrl }, caption: \`🔲 *QR Code:*\\n\${argsStr}\` }, { quoted: msg });
                    break;
                case "dnslookup":
                    const dnsRes = await axios.get(\`https://api.hackertarget.com/dnslookup/?q=\${encodeURIComponent(argsStr)}\`);
                    await this.sock.sendMessage(jid, { text: \`🔍 *DNS Lookup:*\\n\\n\${dnsRes.data}\` }, { quoted: msg });
                    break;
                case "whois":
                    const whoisRes = await axios.get(\`https://api.hackertarget.com/whois/?q=\${encodeURIComponent(argsStr)}\`);
                    await this.sock.sendMessage(jid, { text: \`🔎 *Whois:*\\n\\n\${whoisRes.data}\` }, { quoted: msg });
                    break;
                case "httpheader":
                    const httpRes = await axios.get(\`https://api.hackertarget.com/httpheaders/?q=\${encodeURIComponent(argsStr)}\`);
                    await this.sock.sendMessage(jid, { text: \`🌐 *HTTP Header:*\\n\\n\${httpRes.data}\` }, { quoted: msg });
                    break;
                case "shortlink":
                    const shortRes = await axios.get(\`https://tinyurl.com/api-create.php?url=\${encodeURIComponent(argsStr)}\`);
                    await this.sock.sendMessage(jid, { text: \`🔗 *Shortlink:*\\n\\n\${shortRes.data}\` }, { quoted: msg });
                    break;
                case "ipinfo":
                case "iplookup":
                    const ipRes = await axios.get(\`http://ip-api.com/json/\${encodeURIComponent(argsStr)}\`);
                    if (ipRes.data.status === "success") {
                        const info = \`📍 *IP Info:*\\n\\nIP: \${ipRes.data.query}\\nNegara: \${ipRes.data.country}\\nKota: \${ipRes.data.city}\\nISP: \${ipRes.data.isp}\\nOrganisasi: \${ipRes.data.org}\\nTimezone: \${ipRes.data.timezone}\`;
                        await this.sock.sendMessage(jid, { text: info }, { quoted: msg });
                    } else {
                        await this.sock.sendMessage(jid, { text: \`❌ *Gagal mendapatkan info IP.*\` }, { quoted: msg });
                    }
                    break;
                case "hostcheck":
                    const hostRes = await axios.get(\`https://api.hackertarget.com/hostsearch/?q=\${encodeURIComponent(argsStr)}\`);
                    await this.sock.sendMessage(jid, { text: \`🌍 *Host Check:*\\n\\n\${hostRes.data}\` }, { quoted: msg });
                    break;
                case "subdomain":
                    const subRes = await axios.get(\`https://api.hackertarget.com/hostsearch/?q=\${encodeURIComponent(argsStr)}\`);
                    await this.sock.sendMessage(jid, { text: \`📂 *Subdomain:*\\n\\n\${subRes.data}\` }, { quoted: msg });
                    break;
                case "countdown":
                    const targetDate = new Date(argsStr);
                    if (isNaN(targetDate.getTime())) {
                        await this.sock.sendMessage(jid, { text: \`❌ *Format tanggal tidak valid.*\\nContoh: .countdown 2024-12-31T23:59:59\` }, { quoted: msg });
                    } else {
                        const now = new Date();
                        const diff = targetDate.getTime() - now.getTime();
                        if (diff <= 0) {
                            await this.sock.sendMessage(jid, { text: \`⏳ *Waktu sudah habis!*\` }, { quoted: msg });
                        } else {
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                            const mins = Math.floor((diff / 1000 / 60) % 60);
                            const secs = Math.floor((diff / 1000) % 60);
                            await this.sock.sendMessage(jid, { text: \`⏳ *Countdown:*\\n\\n\${days} Hari \${hours} Jam \${mins} Menit \${secs} Detik\` }, { quoted: msg });
                        }
                    }
                    break;
            }
        } catch (e) {
            await this.sock.sendMessage(jid, { text: \`❌ *Terjadi kesalahan saat memproses \${cmd}.*\` }, { quoted: msg });
        }`;

if (!code.includes('if (cmd === "toolsmenu")')) {
  code = code.replace(
    "} else if (beritaCommands.includes(requestedCmd.toLowerCase()) || beritaCommands.includes(\".\" + requestedCmd.toLowerCase())) {",
    toolsLogic + '\n    } else if (beritaCommands.includes(requestedCmd.toLowerCase()) || beritaCommands.includes("." + requestedCmd.toLowerCase())) {'
  );
  fs.writeFileSync(filePath, code, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Already patched");
}
