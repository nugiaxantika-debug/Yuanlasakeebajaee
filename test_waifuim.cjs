const axios = require("axios");

async function run() {
    try {
        const url = `https://api.waifu.im/search/?is_nsfw=true`;
        const res = await axios.get(url);
        console.log("waifu.im", res.data.images[0].url);
    } catch (e) {
        console.log("waifu.im error", e.message);
    }
}
run();
