const axios = require('axios');
async function test() {
  const hotQueries = ["malaysia sexy girl", "malaysian bikini", "malaysia hot girl"];
  for (const q of hotQueries) {
    try {
      const fetchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${q}`);
      let videos = fetchRes.data?.data?.videos || [];
      const filtered = videos.filter((v) => v.region === 'MY');
      console.log(q, "-> Total:", videos.length, "MY:", filtered.length);
    } catch(e) {
      console.error(q, "-> Error", e.message);
    }
  }
}
test();
