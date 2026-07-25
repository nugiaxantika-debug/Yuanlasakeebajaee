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
    await test('https://api.ryzendesu.vip/api/ai/chatgpt?text=halo');
    await test('https://api.zenkey.my.id/api/openai?text=halo&apikey=zenkey');
    await test('https://api.vreden.web.id/api/ai/gpt?query=halo');
}
run();
