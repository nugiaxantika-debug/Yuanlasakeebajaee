const systemPrompt = "You are a helpful assistant.";
const query = "hello";
try {
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
   if (response.ok) {
       const data = await response.json();
       let answer = data?.choices?.[0]?.message?.content;
       if (!answer) {
          const textRes = await fetch('https://text.pollinations.ai/'+encodeURIComponent(query));
          if (textRes.ok) answer = await textRes.text();
       }
       console.log("OK:", answer);
   } else {
       const errText = await response.text();
       console.error("Pollinations error:", response.status, errText);
   }
} catch (e) {
   console.error("Third party AI error:", e);
}
