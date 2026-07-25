const axios = require('axios');
async function test() {
  try {
    const searchQuery = "amoi bikini malaysia";
    const fetchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${searchQuery}`);
    console.log(fetchRes.data.code, fetchRes.data.data?.videos?.length);
  } catch(e) {
    console.error(e.message);
  }
}
test();
