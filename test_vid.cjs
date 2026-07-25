const scraper = require('@vreden/youtube_scraper');
console.log(Object.keys(scraper));
async function test() {
    console.log(await scraper.search("bikini try on haul tiktok", { limit: 1 }));
}
test();
