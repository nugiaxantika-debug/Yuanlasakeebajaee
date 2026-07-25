const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

function run() {
  const adContext = {
    forwardingScore: 999,
    isForwarded: true,
    businessMessageForwardInfo: {
      businessOwnerJid: "123@s.whatsapp.net"
    }
  };
  const interactiveMsg = generateWAMessageFromContent("123@s.whatsapp.net", {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          contextInfo: adContext,
          body: proto.Message.InteractiveMessage.Body.create({
            text: "menu text"
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({
            text: "Wabot Pro"
          }),
          header: proto.Message.InteractiveMessage.Header.create({
            title: "Header title",
            subtitle: "",
            hasMediaAttachment: false
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Lihat saluran",
                  url: "http://whatsapp.com",
                  merchant_url: "http://whatsapp.com"
                })
              }
            ]
          })
        })
      }
    }
  }, { quoted: null });
  console.log(interactiveMsg);
}
run();
