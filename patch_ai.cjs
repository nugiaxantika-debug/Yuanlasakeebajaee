const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

const target = `    } else if ([".gpt4", "gpt4", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai"].includes(body.split(" ")[0].toLowerCase())) {`;
const replacement = `    } else if ([".gpt4", "gpt4", ".gpt", "gpt", ".gemini", "gemini", ".deepseek", "deepseek", ".ai", "ai", ".bing", "bing", ".askai", "askai", ".ask", "ask"].includes(body.split(" ")[0].toLowerCase())) {`;

code = code.replace(target, replacement);

const target2 = `                   if (!answer) {
                      // Fallback to text prompt api
                      const textRes = await fetch('https://text.pollinations.ai/'+encodeURIComponent(query));
                      if (textRes.ok) answer = await textRes.text();
                   }
               } else {
                   const errText = await response.text();
                   console.error("Pollinations error:", response.status, errText);
                   answer = "❌ Gagal mendapatkan respon dari AI (Status: " + response.status + ")";
               }
            } catch (e) {
               console.error("Third party AI error:", e);
               answer = "❌ Gagal menghubungi layanan AI pihak ketiga.";
            }
        }`;

const replacement2 = `                   if (!answer) {
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

code = code.replace(target2, replacement2);

fs.writeFileSync('src/services/whatsapp.ts', code);
