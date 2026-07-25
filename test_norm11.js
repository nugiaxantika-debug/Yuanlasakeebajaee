const assert = require('assert');
function normalizeJid(jidStr) {
    if (!jidStr) return "";
    let clean = jidStr.replace(/:\d+/, "");
    if (clean.endsWith("@g.us")) { return clean.split("@")[0] + "@g.us"; }
    if (clean.endsWith("@lid")) { return clean.split("@")[0] + "@lid"; }
    let numPart = clean.replace(/[^0-9]/g, "");
    if (numPart.startsWith("0")) { numPart = "62" + numPart.slice(1); }
    return numPart + "@s.whatsapp.net";
}

console.log(normalizeJid("+2347072773454"));
console.log(normalizeJid("+2347072773454@s.whatsapp.net"));
console.log(normalizeJid("2347072773454"));
console.log(normalizeJid("628123456789"));
