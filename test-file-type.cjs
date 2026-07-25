const { Jimp } = require('jimp');
async function run() {
    const bg = new Jimp({ width: 100, height: 100, color: '#118EE9' });
    const buf = await bg.getBuffer('image/png');
    const fileType = await import('file-type');
    const res = await fileType.fileTypeFromBuffer(buf);
    console.log("fileType:", res);
    const res2 = await fileType.fileTypeFromBuffer(Buffer.from(buf));
    console.log("fileType (Buffer.from):", res2);
}
run();
