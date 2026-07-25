const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const regex = /const args = \[\s*bgPath,[\s\S]*?\}\);/m;

const replaceContent = `           const { registerFont, createCanvas, loadImage } = await import('canvas');
           try {
             registerFont(fontPath, { family: 'Indie Flower' });
           } catch(e) {}
           
           const bgImage = await loadImage(bgPath);
           const canvas = createCanvas(1024, 784);
           const ctx = canvas.getContext('2d');
           
           ctx.drawImage(bgImage, 0, 0, 1024, 784);
           ctx.fillStyle = '#1b1b1b';
           
           // hari
           ctx.font = '20px "Indie Flower"';
           ctx.fillText(hari, 806, 78);
           
           // tanggal
           ctx.font = '18px "Indie Flower"';
           ctx.fillText(tanggal, 806, 102);
           
           // nama
           ctx.fillText(msg.pushName || 'User', 360, 100);
           
           // kelas
           ctx.fillText('-', 360, 120);
           
           // teks baris per baris
           ctx.font = '20px "Indie Flower"';
           const lines = panjangBaris5.split('\\n');
           let startY = 142;
           const lineHeight = 21; 
           
           for(let i=0; i<lines.length; i++) {
              ctx.fillText(lines[i], 344, startY + (i * 22));
           }
           
           const buffer = canvas.toBuffer('image/jpeg');
           fs.writeFileSync(tempFile, buffer);`;

if (regex.test(content)) {
    content = content.replace(regex, replaceContent);
    fs.writeFileSync('src/services/whatsapp.ts', content);
    console.log('Successfully patched nulis feature using regex');
} else {
    console.log('Could not find target content using regex');
}
