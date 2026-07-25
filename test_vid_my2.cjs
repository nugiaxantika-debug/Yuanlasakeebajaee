const axios = require('axios');
async function test() {
  try {
    const searchQuery = "amoi bikini malaysia";
    const fetchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${searchQuery}`);
    let videos = fetchRes.data.data.videos;
    const filtered = videos.filter((v) => v.region === 'MY');
    console.log("Total:", videos.length, "MY:", filtered.length);
  } catch(e) {
    console.error(e.message);
  }
}
test();
