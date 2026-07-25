const axios = require('axios');
async function test() {
    try {
      const fetchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=amoi%20bikini%20malaysia`);
      let videos = fetchRes.data?.data?.videos || [];
      console.log(videos.map(v => v.play));
    } catch(e) {
      console.error(e.message);
    }
}
test();
