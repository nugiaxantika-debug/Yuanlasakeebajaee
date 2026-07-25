const { openai } = require('betabotz-tools');
async function run() {
    const res = await openai("halo");
    console.log(res);
}
run();
