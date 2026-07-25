const { registerFont, createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function testCanvas() {
  const nulisDir = path.join(process.cwd(), 'node_modules', 'nulis-buku');
  const bgPath = path.join(nulisDir, 'assets', 'buku1.jpg');
  const fontPath = path.join(nulisDir, 'font', 'Indie-Flower.ttf');
  
  registerFont(fontPath, { family: 'Indie Flower' });
  
  const bgImage = await loadImage(bgPath);
  const canvas = createCanvas(1024, 784); // using same dimension as imagemagick
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bgImage, 0, 0, 1024, 784);
  
  ctx.fillStyle = '#1b1b1b';
  
  ctx.font = '20px "Indie Flower"';
  ctx.fillText('Sabtu', 806, 78);
  
  ctx.font = '18px "Indie Flower"';
  ctx.fillText('20/07/2026', 806, 102);
  ctx.fillText('User', 360, 100);
  ctx.fillText('-', 360, 120);
  
  ctx.font = '20px "Indie Flower"';
  const textLines = "Ini adalah percobaan nulis di buku pakai canvas.\nSemoga berhasil ya!".split('\n');
  let startY = 142;
  const lineSpacing = 20 - 7.5; // pointsize 20 - 7.5 interline spacing ? wait, in canvas we can just do line height.
  // wait, ImageMagick does +142 for the first line. 
  // let's try 142, then + 25 for next lines.
  textLines.forEach((line, idx) => {
    ctx.fillText(line, 344, startY + (idx * 22)); // Adjust spacing
  });
  
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync('test_nulis.jpg', buffer);
  console.log('Saved to test_nulis.jpg');
}
testCanvas().catch(console.error);
