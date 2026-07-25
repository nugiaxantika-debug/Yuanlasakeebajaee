async function run() {
    try {
        const statusRes = await fetch('https://duckduckgo.com/duckchat/v1/status', {
            headers: {
                "x-vqd-accept": "1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const vqd = statusRes.headers.get('x-vqd-4');
        console.log("Status:", statusRes.status);
        console.log("VQD:", vqd);
        
        if (vqd) {
            const chatRes = await fetch('https://duckduckgo.com/duckchat/v1/chat', {
                method: "POST",
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: "halo" }]
                }),
                headers: {
                    "x-vqd-4": vqd,
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });
            console.log("Chat Status:", chatRes.status);
            const text = await chatRes.text();
            console.log("Response:", text.slice(0, 100));
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
