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
    await test('https://api.vyturex.com/prompt?q=halo');
    await test('https://api.nyxs.pw/ai/gpt4?text=halo');
    await test('https://api.neoxr.eu/api/gpt?q=halo');
    await test('https://api.popcat.xyz/chatbot?msg=halo&owner=User&botname=Bot');
    await test('https://api.joshweb.click/api/gpt-4?q=halo');
    await test('https://api.siputzx.my.id/api/ai/gpt3?prompt=halo');
    await test('https://api.siputzx.my.id/api/ai/gpt4?prompt=halo');
}
run();
