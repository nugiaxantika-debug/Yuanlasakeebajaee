class Bot {
  constructor() {
    this.ownerNumbers = new Set();
  }
  
  normalizeJid(jidStr) {
    if (!jidStr) return "";
    let clean = jidStr.replace(/:\d+/, "");
    const parts = clean.split("@");
    let numPart = parts[0].replace(/[^0-9]/g, "");
    if (numPart.startsWith("0")) {
        numPart = "62" + numPart.slice(1);
    }
    if (clean.includes("@g.us")) {
        return numPart + "@g.us";
    }
    return numPart + "@s.whatsapp.net";
  }

  handleAddOwner(msg, messageContent, argsStr) {
    let targetJid = "";
    if (argsStr) {
        targetJid = this.normalizeJid(argsStr + "@s.whatsapp.net");
    }
    if (targetJid) targetJid = this.normalizeJid(targetJid);
    
    this.ownerNumbers.add(targetJid);
  }

  isOwnerCheck(jid) {
    const senderJid = this.normalizeJid(jid);
    return this.ownerNumbers.has(senderJid);
  }
}

const bot = new Bot();
bot.handleAddOwner(null, "", "6281234567890");
console.log("Has 6281234567890?", bot.isOwnerCheck("6281234567890@s.whatsapp.net"));

bot.handleAddOwner(null, "", "08123456789");
console.log("Has 08123456789?", bot.isOwnerCheck("08123456789@s.whatsapp.net"));
console.log("Has 08123456789 via 62?", bot.isOwnerCheck("628123456789@s.whatsapp.net"));

bot.handleAddOwner(null, "", "14151234567");
console.log("Has 14151234567?", bot.isOwnerCheck("14151234567@s.whatsapp.net"));

