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
    await test('https://api.vreden.web.id/api/openai?query=halo');
    await test('https://api.yanzbotz.my.id/api/ai/gpt4?query=halo');
    await test('https://api.lolhuman.xyz/api/openai?apikey=lol&text=halo');
    await test('https://widipe.com/openai?text=halo');
    await test('https://itzpire.com/ai/gpt-logic?q=halo&logic=AI');
    await test('https://api.agatz.xyz/api/gemini?message=halo');
}
run();
