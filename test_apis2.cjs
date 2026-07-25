const axios = require('axios');
async function test(url) {
    try {
        const res = await axios.get(url, { timeout: 10000 });
        console.log("Success:", url, "->", typeof res.data === 'object' ? JSON.stringify(res.data).substring(0,80) : res.data.substring(0,80));
    } catch(e) {
        console.log("Error:", url, "->", e.message);
    }
}
async function run() {
    await test('https://api.lolhuman.xyz/api/openai?apikey=sgwn&text=halo'); // fake apikey?
    await test('https://api.zenkey.my.id/api/openai?text=halo&apikey=zenkey'); 
    await test('https://aemt.me/gpt4?text=halo');
    await test('https://aemt.me/gemini?text=halo');
}
run();
