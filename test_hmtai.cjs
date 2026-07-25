const hmtai = require('hmtai');
async function run() {
    try {
        console.log(await hmtai.nsfw.hentai());
    } catch (e) {
        console.error(e.message);
    }
}
run();
