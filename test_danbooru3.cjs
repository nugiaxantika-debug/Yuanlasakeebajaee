const axios = require('axios');
async function run() {
    try {
        const res = await axios.get(`https://danbooru.donmai.us/posts.json?tags=rating:explicit+ahegao&limit=1&random=true`);
        console.log(Object.keys(res.data[0]));
    } catch(e) { console.error('error') }
}
run();
