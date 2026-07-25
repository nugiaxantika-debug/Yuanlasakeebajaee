const axios = require('axios');
async function run() {
    const tags = ['rating:explicit', 'rating:explicit+ahegao', 'rating:explicit+ass', 'rating:explicit+bdsm', 'rating:explicit+group_sex', 'rating:explicit+yaoi', 'rating:explicit+loli', 'rating:explicit+cat_girl', 'rating:explicit+pussy', 'rating:explicit+zettai_ryouiki'];
    for (const t of tags) {
        try {
            const res = await axios.get(`https://danbooru.donmai.us/posts.json?tags=${t}&limit=1&random=true`);
            if (res.data && res.data.length > 0) {
                console.log(t, res.data[0].file_url || res.data[0].large_file_url);
            } else {
                console.log(t, 'not found');
            }
        } catch(e) {
            console.error(t, 'error');
        }
    }
}
run();
