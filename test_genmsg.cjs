const { generateWAMessageContent } = require('@whiskeysockets/baileys');
async function run() {
  try {
    const content = await generateWAMessageContent({ image: Buffer.from('test') }, { upload: () => {} });
    console.log(content.imageMessage ? "Has imageMessage" : "No imageMessage");
  } catch(e) { console.error(e.message); }
}
run();
