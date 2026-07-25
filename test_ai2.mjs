import { duckduckgo } from "duck-ai";
try {
  const result = await duckduckgo("hello", "gpt-4o-mini");
  console.log("duck-ai:", result);
} catch(e) { console.error("duck-ai err:", e); }
