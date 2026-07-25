const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const target = `               const response = await fetch('https://text.pollinations.ai/openai', {
                   method: 'POST',
                   headers: {
                      'Content-Type': 'application/json',
                     'User-Agent': 'Mozilla/5.0'
                   },
                   body: JSON.stringify(payload)
               });
               if (response.ok) {
                   const data = await response.json();
                   answer = data?.choices?.[0]?.message?.content;
                   if (!answer) {
                      const textRes = await fetch('https://text.pollinations.ai/'+encodeURIComponent(query));
                      if (textRes.ok) answer = await textRes.text();
                   }
               } else {
                   const errText = await response.text();
                   console.error("Pollinations error:", response.status, errText);
               }
            } catch (e) {
               console.error("Third party AI error:", e);
            }
            
            if (!answer) {
                try {
                    const textRes = await fetch('https://text.pollinations.ai/'+encodeURIComponent(query));
                    if (textRes.ok) answer = await textRes.text();
                } catch (e2) {
                    answer = "❌ Gagal menghubungi layanan AI pihak ketiga.";
                }
            }
            if (!answer) answer = "❌ Gagal mendapatkan respon dari AI.";
        }`;

const replacement = `               const response = await axios.post('https://text.pollinations.ai/openai', payload, {
                   headers: {
                      'Content-Type': 'application/json',
                      'User-Agent': 'Mozilla/5.0'
                   }
               });
               if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                   answer = response.data.choices[0].message.content;
               }
            } catch (e) {
               console.error("Pollinations OpenAI error:", e.message);
            }
            
            if (!answer) {
                try {
                    const textRes = await axios.get('https://text.pollinations.ai/'+encodeURIComponent(query), {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (textRes.data) {
                        answer = typeof textRes.data === 'string' ? textRes.data : JSON.stringify(textRes.data);
                    }
                } catch (e2) {
                    console.error("Pollinations Text error:", e2.message);
                }
            }
            if (!answer) answer = "❌ Gagal mendapatkan respon dari AI.";
        }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/services/whatsapp.ts', code);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
