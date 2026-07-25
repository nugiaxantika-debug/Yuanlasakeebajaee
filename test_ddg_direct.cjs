const axios = require('axios');
async function run() {
    try {
        const statusRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
            headers: { "x-vqd-accept": "1" }
        });
        const vqd = statusRes.headers['x-vqd-4'];
        console.log("VQD:", vqd);
        
        const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "halo, ini dari mana?" }]
        }, {
            headers: {
                "x-vqd-4": vqd,
                "Content-Type": "application/json"
            }
        });
        console.log("ChatRes:", chatRes.data);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
