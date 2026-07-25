const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `      if (this.channelLink) {
        let imageMsg = null;
        if (this.coverImageBuffer) {
            const mediaContent = await generateWAMessageContent(
                { image: this.coverImageBuffer },
                { upload: this.sock.waUploadToServer }
            );
            imageMsg = mediaContent.imageMessage;
        }

        const interactiveMsg = generateWAMessageFromContent(jid, {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                contextInfo: adContext,
                body: proto.Message.InteractiveMessage.Body.create({
                  text: menu
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: this.poweredByText || "Wabot Pro"
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  title: "",
                  subtitle: "",
                  hasMediaAttachment: !!imageMsg,
                  ...(imageMsg ? { imageMessage: imageMsg } : {})
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [
                    {
                      name: "cta_url",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Lihat saluran",
                        url: this.channelLink,
                        merchant_url: this.channelLink
                      })
                    }
                  ]
                })
              })
            }
          }
        }, { quoted: msg });

        await this.sock.relayMessage(jid, interactiveMsg.message, { messageId: interactiveMsg.key.id });
      } else {
        if (this.coverImageBuffer) {
          await this.sock.sendMessage(jid, { 
            image: this.coverImageBuffer, 
            caption: menu,
            contextInfo: adContext
          }, { quoted: msg });
        } else {
          await this.sock.sendMessage(jid, { 
            text: menu,
            contextInfo: adContext
          }, { quoted: msg });
        }
      }
      this.broadcastState(\`Responded to allmenu command\`);`;

const replacement = `      try {
        if (this.channelLink) {
          let imageMsg = null;
          if (this.coverImageBuffer) {
              const mediaContent = await generateWAMessageContent(
                  { image: this.coverImageBuffer },
                  { upload: this.sock.waUploadToServer }
              );
              imageMsg = mediaContent.imageMessage;
          }

          const interactiveMsg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                  contextInfo: adContext,
                  body: proto.Message.InteractiveMessage.Body.create({
                    text: menu
                  }),
                  footer: proto.Message.InteractiveMessage.Footer.create({
                    text: this.poweredByText || "Wabot Pro"
                  }),
                  header: proto.Message.InteractiveMessage.Header.create({
                    title: "",
                    subtitle: "",
                    hasMediaAttachment: !!imageMsg,
                    ...(imageMsg ? { imageMessage: imageMsg } : {})
                  }),
                  nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: [
                      {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                          display_text: "Lihat saluran",
                          url: this.channelLink,
                          merchant_url: this.channelLink
                        })
                      }
                    ]
                  })
                })
              }
            }
          }, { quoted: msg });

          await this.sock.relayMessage(jid, interactiveMsg.message, { messageId: interactiveMsg.key.id });
        } else {
          if (this.coverImageBuffer) {
            await this.sock.sendMessage(jid, { 
              image: this.coverImageBuffer, 
              caption: menu,
              contextInfo: adContext
            }, { quoted: msg });
          } else {
            await this.sock.sendMessage(jid, { 
              text: menu,
              contextInfo: adContext
            }, { quoted: msg });
          }
        }
        this.broadcastState(\`Responded to allmenu command\`);
      } catch (err: any) {
        console.error("Error sending allmenu:", err);
        this.broadcastState(\`Error sending allmenu: \${err.message}\`);
        await this.sock.sendMessage(jid, { text: \`⚠️ Terjadi kesalahan saat mengirim menu.\` }, { quoted: msg });
      }`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Success");
