import { initChat } from "duckduckgo-ai-chat/dist/index.js";
try {
  const chat = await initChat("gpt-4o-mini");
  const result = await chat.fetch("hello");
  console.log("duck:", result.message);
} catch (e) {
  console.error("duck error:", e);
}
