const ab = require('ab-downloader');
async function run() {
    try {
        const p = await ab.pinterest('hantu tuyul penampakan');
        console.log(p.result.result[0].image_url);
    } catch(e) { console.error('error', e.message) }
}
run();
