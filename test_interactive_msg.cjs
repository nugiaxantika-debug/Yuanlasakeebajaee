const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

function createInteractiveMessage(jid, text, footer, buttonText, buttonUrl, imageMsg) {
  const msg = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: text
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: footer
            }),
            header: proto.Message.InteractiveMessage.Header.create({
              title: "",
              subtitle: "",
              hasMediaAttachment: imageMsg ? true : false,
              ...(imageMsg ? {
                  imageMessage: imageMsg
              } : {})
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  "name": "cta_url",
                  "buttonParamsJson": JSON.stringify({display_text: buttonText, url: buttonUrl, merchant_url: buttonUrl})
                }
              ]
            })
          })
      }
    }
  }, {});
  return msg;
}
module.exports = { createInteractiveMessage };
