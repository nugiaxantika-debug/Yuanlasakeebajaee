const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

function run() {
  try {
      const msg = generateWAMessageFromContent('123@s.whatsapp.net', {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: "test"
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "Wabot Pro"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: "",
                subtitle: "",
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                      display_text: "Lihat saluran",
                      url: "http://example.com",
                      merchant_url: "http://example.com"
                    })
                  }
                ]
              })
            })
          }
        }
      }, { quoted: null });
      console.log(msg.message.viewOnceMessage.message.interactiveMessage);
  } catch(e) { console.error("ERR:", e); }
}
run();
