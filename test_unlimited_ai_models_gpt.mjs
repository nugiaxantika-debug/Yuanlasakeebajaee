import { models } from 'unlimited-ai';
async function run() {
    try {
        const m = await models();
        console.log(m.filter(x => x.includes("gpt")));
    } catch(e) {
        console.log(e.message);
    }
}
run();
