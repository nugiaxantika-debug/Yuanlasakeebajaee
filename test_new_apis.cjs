const axios = require('axios');
async function test() {
    try {
        const res = await axios.get("https://nekos.life/api/v2/img/wallpaper");
        console.log(res.data);
    } catch(e) { console.log(e.message) }
}
test();
