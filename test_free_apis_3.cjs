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
    await test('https://darkness.ashlynn.workers.dev/chat/?prompt=halo&model=gpt-4o-mini');
    await test('https://widipe.com/openai?text=halo');
    await test('https://api.lolhuman.xyz/api/openai-turbo?apikey=lol&text=halo');
    await test('https://btch.xyz/api/openai?text=halo');
    await test('https://aemt.me/openai?text=halo');
}
run();
