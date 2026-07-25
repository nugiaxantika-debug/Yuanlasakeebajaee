const ab = require('ab-downloader');
async function run() {
    try {
        const p = await ab.pinterest('poster film pengabdi setan');
        console.log("Found:", p && p.result && p.result.result && p.result.result.length > 0);
    } catch(e) {
        console.error("Error", e.message);
    }
}
run();
