const { DuckAI } = require('duck-ai');
async function run() {
    try {
        const duck = new DuckAI();
        const chat = await duck.chat("Halo");
        console.log(chat);
    } catch(e) {
        console.error(e.message);
    }
}
run();
