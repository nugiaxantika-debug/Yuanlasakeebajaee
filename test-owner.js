const args = "08123456789";
let targetJid = args.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
targetJid = targetJid.replace(/:\d+/, "");
console.log(targetJid);
