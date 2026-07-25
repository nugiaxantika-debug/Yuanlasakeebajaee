const axios = require('axios');
async function run() {
    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/event-stream",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://duckduckgo.com/",
            "Origin": "https://duckduckgo.com",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Connection": "keep-alive",
            "x-vqd-accept": "1"
        };
        const statusRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', { headers });
        const vqd = statusRes.headers['x-vqd-4'];
        console.log("VQD:", vqd);
        
        if (vqd) {
            const chatHeaders = {
                ...headers,
                "x-vqd-4": vqd,
                "Content-Type": "application/json"
            };
            delete chatHeaders["x-vqd-accept"];
            
            const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "halo, ini dari mana?" }]
            }, {
                headers: chatHeaders,
                responseType: 'stream'
            });
            
            chatRes.data.on('data', chunk => {
                console.log(chunk.toString());
            });
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
