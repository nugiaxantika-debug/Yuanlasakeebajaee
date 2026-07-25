const axios = require('axios');
const cheerio = require('cheerio');

async function searchBokep() {
    try {
        const res = await axios.get('https://www.eporner.com/search/indonesia/', {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        console.log("Status:", res.status);
    } catch(e) {
        console.error(e.message);
    }
}
searchBokep();
