const axios = require('axios');
async function run() {
    try {
        const payload = {
            model: "openai",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "halo siapa kamu" }
            ]
        };
        const response = await axios.post('https://text.pollinations.ai/openai', payload, {
            headers: {
               'Content-Type': 'application/json',
               'User-Agent': 'Mozilla/5.0'
            }
        });
        console.log(response.data);
    } catch(e) {
        console.log(e.message, e.response?.data);
    }
}
run();
