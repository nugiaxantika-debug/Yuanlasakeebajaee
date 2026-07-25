const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const targetContent = `           const args = [
               bgPath,
               '-font', fontPath,
               '-fill', '#1b1b1b',
               '-size', '1024x784',
               '-pointsize', '20',
               '-interline-spacing', '1',
               '-annotate', '+806+78', hari,
               '-font', fontPath,
               '-fill', '#1b1b1b',
               '-size', '1024x784',
               '-pointsize', '18',
               '-interline-spacing', '1',
               '-annotate', '+806+102', tanggal,
               '-font', fontPath,
               '-fill', '#1b1b1b',
               '-size', '1024x784',
               '-pointsize', '18',
               '-interline-spacing', '1',
               '-annotate', '+360+100', msg.pushName || 'User',
               '-font', fontPath,
               '-fill', '#1b1b1b',
               '-size', '1024x784',
               '-pointsize', '18',
               '-interline-spacing', '1',
               '-annotate', '+360+120', '-',
               '-font', fontPath,
               '-fill', '#1b1b1b',
               '-size', '1024x784',
               '-pointsize', '20',
               '-interline-spacing', '-7.5',
               '-annotate', '+344+142', panjangBaris5,
               tempFile
           ];
           await new Promise((resolve, reject) => {
               const proc = spawn('convert', args);
               proc.on('close', resolve);
               proc.on('error', reject);
           });`;

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
           const lineHeight = 21; // estimated line height for pointsize 20 with -7.5 interline spacing ? 20 - 7.5 = 12.5? Actually line spacing on physical book image
           // let's use 23 as it usually aligns well with standard lined paper
           
           for(let i=0; i<lines.length; i++) {
              ctx.fillText(lines[i], 344, startY + (i * 22));
           }
           
           const buffer = canvas.toBuffer('image/jpeg');
           fs.writeFileSync(tempFile, buffer);`;

if (content.includes(targetContent)) {
    content = content.replace(targetContent, replaceContent);
    fs.writeFileSync('src/services/whatsapp.ts', content);
    console.log('Successfully patched nulis feature');
} else {
    console.log('Could not find target content');
}
