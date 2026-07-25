const axios = require("axios");
async function run() {
    try {
        const endpoints = ["hentai", "nsfw", "ahegao", "ass", "bdsm", "gangbang", "gay", "loli", "neko", "pussy", "zettai", "waifu"];
        const valid = [];
        for (const ep of endpoints) {
            try {
                const url = `https://nekos.life/api/v2/img/${ep}`;
                const res = await axios.get(url);
                console.log("nekos.life", ep, res.data.url ? "OK" : "NO");
                if (res.data.url) valid.push(ep);
            } catch (e) {
                console.log("nekos.life", ep, e.response ? e.response.status : e.message);
            }
        }
        console.log("Valid nekos.life endpoints:", valid);
    } catch (e) {}
}
run();
