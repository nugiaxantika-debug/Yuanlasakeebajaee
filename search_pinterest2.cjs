const ab = require("ab-downloader");
async function run() {
    const p = await ab.pinterest('pocong horror');
    console.log(p.result.result[0].image_url);
}
run();
