const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `    } else if (body === ".testcta") {
      try {
        const adContext = {
          forwardingScore: 999,
          isForwarded: true,
          businessMessageForwardInfo: {
            businessOwnerJid: this.sock.user?.id ? this.sock.user.id.split(':')[0] + '@s.whatsapp.net' : '6281234567890@s.whatsapp.net'
          }
        };
        const interactiveMsg = generateWAMessageFromContent(jid, {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                contextInfo: adContext,
                body: proto.Message.InteractiveMessage.Body.create({ text: "Test CTA Body" }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: "Footer" }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [
                    {
                      name: "cta_url",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Lihat saluran",
                        url: "https://whatsapp.com/channel/xxx",
                        merchant_url: "https://whatsapp.com/channel/xxx"
                      })
                    }
                  ]
                })
              })
            }
          }
        }, { quoted: msg });
        
        await this.sock.relayMessage(jid, interactiveMsg.message, { messageId: interactiveMsg.key.id });
        await this.sock.sendMessage(jid, { text: "Success relay" }, { quoted: msg });
      } catch (err: any) {
        console.error("CTA Test Error:", err);
        await this.sock.sendMessage(jid, { text: "Error: " + err.message }, { quoted: msg });
      }
    } else if (body.startsWith(".addcmd") || body.startsWith("addcmd")) {`;

const replacement = `    } else if (body.startsWith(".addcmd") || body.startsWith("addcmd")) {`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Success removed testcta");
