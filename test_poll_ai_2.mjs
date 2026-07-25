const systemPrompt = "You are a helpful assistant.";
const query = "halo";
const payload = {
   model: "openai",
   messages: [
       { role: "system", content: systemPrompt },
       { role: "user", content: query }
   ]
};
const response = await fetch('https://text.pollinations.ai/openai', {
   method: 'POST',
   headers: {
      'Content-Type': 'application/json',
     'User-Agent': 'Mozilla/5.0'
   },
   body: JSON.stringify(payload)
});
console.log("Status:", response.status);
const text = await response.text();
console.log("Raw output:", text);
