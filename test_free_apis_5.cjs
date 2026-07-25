const axios = require('axios');
async function test(url) {
    try {
        const res = await axios.get(url, { timeout: 10000 });
        console.log("Success:", url, "->", typeof res.data === 'object' ? JSON.stringify(res.data).substring(0,100) : res.data.substring(0,100));
    } catch(e) {
        console.log("Error:", url, "->", e.message);
    }
}
async function run() {
    await test('https://api.vreden.my.id/api/openai?query=halo');
    await test('https://api.neoxr.my.id/api/gpt?q=halo');
    await test('https://vreden.my.id/api/openai?query=halo');
}
run();
