const axios = require('axios');
async function test(url) {
    try {
        const res = await axios.get(url, { timeout: 5000 });
        console.log("Success:", url, "->", typeof res.data === 'object' ? JSON.stringify(res.data).substring(0,50) : res.data.substring(0,50));
    } catch(e) {
        console.log("Error:", url, "->", e.message);
    }
}
async function run() {
    await test('https://api.agatz.xyz/api/gemini?message=halo');
    await test('https://api.agatz.xyz/api/gpt?message=halo');
    await test('https://api.ryzendesu.vip/api/ai/v2/chatgpt?text=halo');
    await test('https://api.ryzendesu.vip/api/ai/chatgpt?text=halo');
    await test('https://api.itzpire.com/ai/gpt-logic?q=halo&logic=AI');
    await test('https://api.akuari.my.id/ai/gpt?chat=halo');
}
run();
