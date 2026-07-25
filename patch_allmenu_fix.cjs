const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetStr = `                  header: proto.Message.InteractiveMessage.Header.create({
                    title: "",
                    subtitle: "",
                    hasMediaAttachment: !!imageMsg,
                    ...(imageMsg ? { imageMessage: imageMsg } : {})
                  }),`;
                  
const replacement = `                  ...(imageMsg ? {
                    header: proto.Message.InteractiveMessage.Header.create({
                      title: "",
                      subtitle: "",
                      hasMediaAttachment: true,
                      imageMessage: imageMsg
                    })
                  } : {}),`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Success patch header");
