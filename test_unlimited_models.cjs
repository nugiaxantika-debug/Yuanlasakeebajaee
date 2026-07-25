async function run() {
  const ai = require('unlimited-ai');
  const models = await ai.availableModels();
  console.log(models.slice(0, 5));
}
run();
