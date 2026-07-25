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
    await test('https://itzpire.com/ai/gpt-logic?q=halo&logic=AI');
    await test('https://api.vreden.web.id/api/openai?query=halo');
    await test('https://api.ryzendesu.vip/api/ai/chatgpt?text=halo');
    await test('https://nyxs-api.onrender.com/ai/gpt4?text=halo');
    await test('https://chatgpt.apinepdev.workers.dev/?question=halo');
    await test('https://api.yanzbotz.my.id/api/ai/gpt4?query=halo');
    await test('https://aemt.me/gpt4?text=halo');
}
run();
