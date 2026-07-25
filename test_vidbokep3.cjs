const axios = require('axios');
const cheerio = require('cheerio');

async function searchBokep(query) {
    try {
        const res = await axios.get(`https://www.eporner.com/search/${query}/`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        const $ = cheerio.load(res.data);
        console.log($('title').text());
        const links = [];
        $('a').each((i, el) => {
           const href = $(el).attr('href');
           if (href && href.includes('/video-')) {
               links.push(href);
           }
        });
        console.log(links.slice(0, 5));
    } catch(e) {
        console.error(e.message);
    }
}
searchBokep('indonesia');
