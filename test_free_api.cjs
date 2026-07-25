const axios = require('axios');
async function run() {
    const apis = [
        "https://api.siputzx.my.id/api/ai/chatgpt3?text=halo",
        "https://itzpire.site/ai/gpt-logic?q=halo&logic=AI",
        "https://aemt.me/openai?text=halo",
        "https://xzn.wtf/api/openai?text=halo&apikey=xzn",
        "https://api.ryzendesu.vip/api/ai/chatgpt?text=halo",
        "https://api.vreden.my.id/api/openai?text=halo"
    ];
    for(const api of apis) {
        try {
            const response = await axios.get(api, { timeout: 4000 });
            console.log("Success:", api, response.data);
        } catch(e) {
            console.log("Error:", api, e.message);
        }
    }
}
run();
