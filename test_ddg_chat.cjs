const { initChat } = require('duckduckgo-ai-chat-cjs');
async function run() {
    try {
        const chat = await initChat("gpt-4o-mini");
        const reply = await chat.fetchFull("Halo");
        console.log("Success:", reply);
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
