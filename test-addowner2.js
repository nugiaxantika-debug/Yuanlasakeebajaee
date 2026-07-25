class Bot {
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
}
const b = new Bot();
console.log(b.normalizeJid("+62 812-3456-7890@s.whatsapp.net"));
console.log(b.normalizeJid("62812-3456-7890@s.whatsapp.net"));
console.log(b.normalizeJid("62 812 3456 7890@s.whatsapp.net"));
