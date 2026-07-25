const { G4F } = require("g4f");
const g4f = new G4F();
async function run() {
    for (const key of Object.keys(g4f.providers)) {
        try {
            console.log("Trying provider:", key);
            const text = await g4f.chatCompletion(
                [{ role: "user", content: "halo" }],
                { provider: g4f.providers[key] }
            );
            console.log("Success with", key, text.slice(0, 50));
            break;
        } catch(e) {
            console.log("Failed with", key, e.message);
        }
    }
}
run();
