import { generate, models } from 'unlimited-ai';
async function run() {
    try {
        console.log("Models:", models);
        const response = await generate("gpt-4o-mini", [{role: "user", content: "halo"}]);
        console.log("Response:", response);
    } catch(e) {
        console.error(e);
    }
}
run();
