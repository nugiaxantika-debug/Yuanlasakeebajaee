const axios = require('axios');
async function run() {
    try {
        const res = await axios.get(`https://danbooru.donmai.us/posts.json?tags=rating:explicit+ahegao&limit=10&random=true`);
        const item = res.data.find(x => x.file_url);
        console.log(item ? item.file_url : 'not found');
    } catch(e) { console.error('error') }
}
run();
