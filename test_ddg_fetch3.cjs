async function run() {
    try {
        const statusRes = await fetch('https://duckduckgo.com/duckchat/v1/status', {
            headers: {
                "x-vqd-accept": "1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        statusRes.headers.forEach((v, k) => console.log(k, v));
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
