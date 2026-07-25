const axios = require("axios");

async function run() {
    try {
        const url = `https://api.waifu.pics/nsfw/waifu`;
        const res = await axios.get(url);
        console.log("waifu.pics", res.data.url);
    } catch (e) {
        console.log("waifu.pics error", e.message);
    }
}
run();
