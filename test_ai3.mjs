import { Chat } from "duck-ai";
try {
  const chat = new Chat("gpt-4o-mini");
  const result = await chat.send("hello");
  console.log("duck-ai:", result);
} catch(e) { console.error("duck-ai err:", e); }
