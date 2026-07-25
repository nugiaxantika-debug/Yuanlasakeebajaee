const ab = require("ab-downloader");
async function run() {
    try {
        const p = await ab.pinterest('hentai anime');
        console.log(p.result.result.length > 0 ? p.result.result[0].image_url : "no results");
    } catch (e) {
        console.error("error", e.message);
    }
}
run();
