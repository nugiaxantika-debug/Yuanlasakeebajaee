import { generate } from 'unlimited-ai';
async function run() {
    try {
        const response = await generate("gpt-3.5-turbo", [{role: "user", content: "halo"}]);
        console.log(response);
    } catch(e) {
        console.log(e.message);
    }
}
run();
