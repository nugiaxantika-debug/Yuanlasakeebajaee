const betabotz = require('betabotz-tools');
async function run() {
    try {
        const response = await betabotz.openai("halo siapa kamu?");
        console.log("Success:", response);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
run();
