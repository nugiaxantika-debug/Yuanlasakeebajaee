const hmtai = require('hmtai');
console.log(hmtai);
const h = new hmtai();
console.log(h.nsfw ? h.nsfw.hentai : "no nsfw");
