function normalizeJid(jidStr) {
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

console.log(normalizeJid("123456789@s.whatsapp.net"));
console.log(normalizeJid("08123456789"));
console.log(normalizeJid("6281234567890@s.whatsapp.net"));
console.log(normalizeJid("123456789:123@s.whatsapp.net"));
