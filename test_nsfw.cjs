const axios = require("axios");

async function run() {
    try {
        const endpoints = ["hentai", "nsfw", "ahegao", "ass", "bdsm", "gangbang", "gay", "loli", "neko", "pussy", "zettai", "waifu"];
        for (const ep of endpoints) {
            try {
                const url = `https://waifu.pics/api/nsfw/${ep}`; // standard endpoint is usually /api/nsfw/:type
                const res = await axios.get(url);
                console.log(ep, res.data.url ? res.data.url : "no url");
            } catch (e) {
                console.log(ep, e.response ? e.response.status : e.message);
            }
        }
    } catch (e) {
        console.error("error", e.message);
    }
}
run();
