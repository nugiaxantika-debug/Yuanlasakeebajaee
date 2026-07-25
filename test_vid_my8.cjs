const axios = require('axios');
async function test() {
  const allQueries = [
    "bikinimodel", "bikini dance", "gravure idol", "swimsuit model", "bikini try on haul",
    "bikini jepang", "gravure idol japan", "japanese girl bikini", "cewek jepang bikini",
    "bikini indo", "cewek indo bikini", "model bikini indonesia", "bikini lokal indonesia",
    "douyin bikini", "chinese girl bikini", "cewek china bikini", "bikini china"
  ];
  for (const q of allQueries) {
    try {
      const fetchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}`);
      let videos = fetchRes.data?.data?.videos || [];
      if (videos.length === 0) console.log(q, "-> 0 results");
    } catch(e) {
      console.error(q, "-> Error");
    }
  }
}
test();
