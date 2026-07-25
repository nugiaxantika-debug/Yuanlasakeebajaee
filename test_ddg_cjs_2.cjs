const { initChat } = require('duckduckgo-ai-chat-cjs');
async function run() {
    try {
        const chat = await initChat("gpt-4o-mini");
        const res = await chat.fetchMessage("Halo siapa kamu?");
        console.log("Success:", res);
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
