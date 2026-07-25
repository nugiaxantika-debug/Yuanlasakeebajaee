const { G4F } = require("g4f");
async function run() {
    const g4f = new G4F();
    const text = await g4f.chatCompletion([{role: "user", content: "halo siapa kamu dan bagaimana buat web?"}]);
    console.log(text);
}
run();
