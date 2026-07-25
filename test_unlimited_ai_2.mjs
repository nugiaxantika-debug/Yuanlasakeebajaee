import { generate } from 'unlimited-ai';
async function run() {
    try {
        const response = await generate("gpt-4o-mini", [{role: "user", content: "halo"}]);
        console.log(response);
    } catch(e) {
        console.log(e.message);
    }
}
run();
