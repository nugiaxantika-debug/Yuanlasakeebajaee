const akaneko = require('akaneko');
async function run() {
    try {
        console.log(await akaneko.nsfw.hentai());
    } catch (e) {
        console.error(e.message);
    }
}
run();
