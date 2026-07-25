import { generate } from 'unlimited-ai';
async function run() {
    try {
        const response = await generate("gpt-4o-mini", [{role: "user", content: "halo bagaimana cara buat web"}]);
        console.log(response);
    } catch(e) {
        console.log("gpt-4o-mini", e.message);
    }
}
run();
