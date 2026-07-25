const axios = require('axios');
async function run() {
    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://duckduckgo.com/",
            "Origin": "https://duckduckgo.com",
            "Connection": "keep-alive"
        };
        const statusRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', { 
            headers: { ...headers, "x-vqd-accept": "1", "Accept": "*/*" } 
        });
        const vqd = statusRes.headers['x-vqd-4'];
        console.log("VQD:", vqd);
        
        if (vqd) {
            const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "halo, ini dari mana?" }]
            }, {
                headers: {
                    ...headers,
                    "x-vqd-4": vqd,
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream"
                },
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
