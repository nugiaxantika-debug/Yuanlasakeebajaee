import { models } from 'unlimited-ai';
async function run() {
    try {
        const m = await models();
        console.log(m);
    } catch(e) {
        console.log(e.message);
    }
}
run();
