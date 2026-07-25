const { gpti } = require("gpti");
const duck = require("duckduckgo-ai-chat");

async function test() {
  try {
     console.log("Testing duckduckgo-ai-chat...");
     const response = await duck.chat("hello, who are you?", "gpt-4o-mini");
     console.log(response);
  } catch (e) { console.error("duck failed:", e); }
  
  try {
     console.log("Testing pollinations JSON...");
     const response = await fetch('https://text.pollinations.ai/openai', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            model: "openai",
            messages: [{ role: "user", content: "hello" }]
         })
     });
     const data = await response.json();
     console.log("Pollinations:", data.choices[0].message.content);
  } catch(e) { console.error("pollinations failed:", e); }
}
test();
