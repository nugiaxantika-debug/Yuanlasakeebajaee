const axios = require('axios');
async function run() {
    try {
        const res = await axios.get("https://danbooru.donmai.us/posts.json?tags=rating:explicit+1girl&limit=5");
        console.log("Danbooru", res.data.map(p => p.file_url).filter(Boolean));
    } catch(e) {
        console.error("Danbooru", e.message);
    }
}
run();
