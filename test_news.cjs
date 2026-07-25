const axios = require('axios');
async function test() {
  const url = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Dsite%3Akompas.com%26hl%3Did%26gl%3DID%26ceid%3DID%3Aid';
  const { data } = await axios.get(url);
  console.log(data.items[0]);
}
test();
