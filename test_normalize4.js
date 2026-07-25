function normalizeJid(jidStr) {
    if (!jidStr) return "";
    let clean = jidStr.replace(/:\d+/, "");
    
    if (clean.endsWith("@g.us")) {
        let groupNum = clean.split("@")[0];
        return groupNum + "@g.us";
    }

    let numPart = clean.replace(/[^0-9]/g, "");
    
    if (numPart.startsWith("0")) {
        numPart = "62" + numPart.slice(1);
    }
    
    return numPart + "@s.whatsapp.net";
}

console.log(normalizeJid("+234 707 277 3454@s.whatsapp.net"));
console.log(normalizeJid("@+234 707 277 3454@s.whatsapp.net"));
