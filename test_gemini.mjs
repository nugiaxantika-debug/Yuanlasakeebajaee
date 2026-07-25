import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
try {
  const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "halo"
  });
  console.log(response.text);
} catch(e) {
  console.log(e);
}
