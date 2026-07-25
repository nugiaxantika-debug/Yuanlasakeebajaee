const axios = require('axios');

async function test() {
    let answer = "";
    try {
        const payload = {
            model: "openai",
            messages: [
                { role: "system", content: "You are AI" },
                { role: "user", content: "halo" }
            ]
        };
        const response = await axios.post('https://text.pollinations.ai/openai', payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            answer = response.data.choices[0].message.content;
        }
    } catch (e) {
        console.error("Pollinations OpenAI error:", e.message);
    }
    
    if (!answer) {
        try {
            const textRes = await axios.get('https://text.pollinations.ai/'+encodeURIComponent('halo'), {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (textRes.data) {
                answer = typeof textRes.data === 'string' ? textRes.data : JSON.stringify(textRes.data);
            }
        } catch (e2) {
            console.error("Pollinations Text error:", e2.message);
        }
    }
    if (!answer) answer = "❌ Gagal mendapatkan respon dari AI.";
    
    console.log("Answer:", answer);
}
test();
