const hmtai = require('hmtai');
const h = new hmtai();
async function run() {
    try {
        console.log(await h.nsfw.hentai());
    } catch(e) { console.error(e.message) }
}
run();
