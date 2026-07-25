import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
try {
  const models = await ai.models.list();
  for await (const m of models) {
    console.log(m.name);
  }
} catch(e) {
  console.log(e);
}
