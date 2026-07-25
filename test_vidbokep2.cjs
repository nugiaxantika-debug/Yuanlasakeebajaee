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
        const results = [];
        $('.mb-box').each((i, el) => {
            if (i >= 5) return;
            const title = $(el).find('.mbtit a').text().trim();
            const url = 'https://www.eporner.com' + $(el).find('.mbtit a').attr('href');
            if (title && url) {
                results.push({ title, url });
            }
        });
        console.log(results);
        
        // try to get direct video url for the first one
        if (results.length > 0) {
            const vidRes = await axios.get(results[0].url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            });
            const html = vidRes.data;
            const match = html.match(/src="([^"]+\.mp4[^"]*)"/);
            if (match) {
                console.log("Found mp4:", match[1]);
            } else {
                console.log("No mp4 found directly in src");
            }
        }
    } catch(e) {
        console.error(e.message);
    }
}
searchBokep('indonesia');
