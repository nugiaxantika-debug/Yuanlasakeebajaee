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
        const links = [];
        $('a').each((i, el) => {
           const href = $(el).attr('href');
           if (href && href.includes('/video-')) {
               const fullUrl = 'https://www.eporner.com' + href;
               if (!links.includes(fullUrl)) {
                   links.push(fullUrl);
               }
           }
        });
        
        console.log("Found", links.length, "links");
        
        if (links.length > 0) {
            const vidUrl = links[0];
            console.log("Fetching", vidUrl);
            const vidRes = await axios.get(vidUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
            });
            const html = vidRes.data;
            
            // Try to find mp4 link in the page
            const match = html.match(/src="([^"]+\.mp4[^"]*)"/);
            if (match) {
                console.log("Direct MP4 link:", match[1]);
            } else {
                console.log("No direct mp4 found in src. Checking download links.");
                const $2 = cheerio.load(html);
                const dls = [];
                $2('a').each((i, el) => {
                    const h = $2(el).attr('href');
                    if (h && h.includes('download')) {
                        dls.push('https://www.eporner.com' + h);
                    }
                });
                console.log("Download links:", dls);
            }
        }
    } catch(e) {
        console.error(e.message);
    }
}
searchBokep('indonesia');
