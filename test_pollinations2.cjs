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
        const response = await axios.post('https://text.pollinations.ai/', payload, {
            headers: {
               'Content-Type': 'application/json'
            }
        });
        console.log("POST:", response.data.choices[0].message.content);
    } catch(e) {
        console.log("POST error:", e.message, e.response?.data);
    }
}
run();
