const axios = require('axios');
const cheerio = require('cheerio');
async function run() {
    const ghosts = ['pocong', 'kuntilanak', 'genderuwo', 'wewe gombel', 'tuyul'];
    for (const g of ghosts) {
        try {
            const res = await axios.get(`https://id.wikipedia.org/wiki/${encodeURIComponent(g)}`);
            const $ = cheerio.load(res.data);
            const img = $('.infobox img, .thumbimage').first().attr('src');
            console.log(g, img ? `https:${img}` : 'no image');
        } catch (e) {
            console.log(g, 'error');
        }
    }
}
run();
