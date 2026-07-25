async function run() {
  try {
    const ai = require('unlimited-ai');
    const result = await ai.generate({
      model: "gpt-4o-mini", // Try model
      messages: [{ role: "user", content: "halo" }]
    });
    console.log(result);
  } catch(e) {
    console.error(e.message);
  }
}
run();
