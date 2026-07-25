const axios = require('axios');
async function run() {
    try {
        const payload = {
            model: "openai",
            messages: [{ role: "user", content: "halo siapa kamu dan bagaimana cara membuat website tolong jelaskan dengan panjang?" }]
        };
        const response = await axios.post('https://text.pollinations.ai/openai', payload);
        console.log(response.data.choices[0].message.content);
    } catch(e) {
        console.log("Error:", e.response?.status, e.response?.data);
    }
}
run();
