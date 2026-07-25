const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

content = content.replace(/plan2ButtonText: "Berlangganan VIP",/, 'plan2ButtonText: "Berlangganan VIP",\n    plan2WhatsAppNumber: "",');

// Redirect logic
content = content.replace(/<button \s*onClick=\{openPaymentModal\}\s*className="w-full text-center block bg-amber-500 text-neutral-950 py-4 rounded-xl font-bold hover:bg-amber-600 transition-colors"\s*>\s*\{webConfig\.plan2ButtonText\}\s*<\/button>/, `<button 
              onClick={() => {
                if (webConfig.plan2WhatsAppNumber) {
                   const msg = encodeURIComponent("Halo, saya ingin berlangganan " + webConfig.plan2Name + ".");
                   const phone = webConfig.plan2WhatsAppNumber.replace(/\\D/g, '');
                   window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
                } else {
                   openPaymentModal();
                }
              }}
              className="w-full text-center block bg-amber-500 text-neutral-950 py-4 rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              {webConfig.plan2ButtonText}
            </button>`);

fs.writeFileSync('src/pages/Landing.tsx', content);
