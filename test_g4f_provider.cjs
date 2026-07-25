const { G4F } = require("g4f");
const g4f = new G4F();
async function run() {
    try {
        const text = await g4f.chatCompletion(
            [{ role: "user", content: "halo siapa kamu" }],
            { provider: g4f.providers.FreeGpt }
        );
        console.log("Success:", text);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
run();
