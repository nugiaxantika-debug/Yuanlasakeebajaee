const { init } = require('duck-ai');
async function run() {
    let agent;
    try {
        agent = init({ headless: true, fast: true });
        const chat = await agent.newChat("gpt-4o-mini");
        const reply = await chat.ask("Halo");
        console.log("Success:", reply);
    } catch(e) {
        console.error("Error:", e.message);
    } finally {
        if (agent) await agent.destroy();
    }
}
run();
