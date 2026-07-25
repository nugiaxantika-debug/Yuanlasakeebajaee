const fs = require('fs');
let text = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

text = text.replace(/\} catch \(e: any\) \{\n    console\.error\("Failed to send welcome message:", e\);\n\}\n              \}\n            \}\n          \} else if \(action === "remove"/, 
`} catch (e: any) {
                console.error("Failed to send welcome message:", e);
              }
            }
          } else if (action === "remove"`);

fs.writeFileSync('src/services/whatsapp.ts', text);
