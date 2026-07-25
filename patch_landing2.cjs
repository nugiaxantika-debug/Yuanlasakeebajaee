const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const oldBtn = `            <button 
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
            </button>`;

const newBtn = `            <button 
              onClick={openPaymentModal}
              className="w-full text-center block bg-amber-500 text-neutral-950 py-4 rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              {webConfig.plan2ButtonText}
            </button>`;

if (content.includes(oldBtn)) {
    content = content.replace(oldBtn, newBtn);
    console.log("VIP button replaced.");
} else {
    console.log("VIP button not found!");
}

const oldCheckout = `    if (checkoutStep === "checkout") {
      window.open("https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012092026060434529470", "_blank");
      setCheckoutStep("confirm");
      return;
    }`;

const newCheckout = `    if (checkoutStep === "checkout") {
      setCheckoutStep("confirm");
      return;
    }`;

if (content.includes(oldCheckout)) {
    content = content.replace(oldCheckout, newCheckout);
    console.log("DANA link removed.");
} else {
    console.log("DANA link not found!");
}

fs.writeFileSync('src/pages/Landing.tsx', content);
