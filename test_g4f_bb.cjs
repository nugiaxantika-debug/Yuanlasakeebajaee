const { G4F } = require("g4f");
const g4f = new G4F();
async function run() {
    try {
        console.log("Trying Blackbox");
        const text = await g4f.chatCompletion(
            [{ role: "user", content: "halo" }],
            { provider: g4f.providers.Blackbox }
        );
        console.log("Success with Blackbox:", text.slice(0, 50));
    } catch(e) {
        console.log("Failed with Blackbox:", e.message);
    }
}
run();
