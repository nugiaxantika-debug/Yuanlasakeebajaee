const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');

async function test() {
  try {
    const res = await fetch("https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png");
    const buffer = await res.arrayBuffer();
    const blob = await removeBackground(new Uint8Array(buffer));
    const outBuffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync('out.png', outBuffer);
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
