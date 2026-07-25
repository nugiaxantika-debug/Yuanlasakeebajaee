const axios = require('axios');
async function test() {
    try {
        const init = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
            headers: { 'x-vqd-accept': '1' }
        });
        const vqd = init.headers['x-vqd-4'];
        console.log("VQD:", vqd);
        const res = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Halo" }]
        }, {
            headers: { 'x-vqd-4': vqd, 'Content-Type': 'application/json' }
        });
        console.log(res.data);
    } catch(e) {
        console.log(e.message, e.response?.data);
    }
}
test();
