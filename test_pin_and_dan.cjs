const axios = require('axios');
const ab = require('ab-downloader');

async function testHentai() {
    try {
        const res = await axios.get(`https://danbooru.donmai.us/posts.json?tags=rating:explicit&limit=1&random=true`);
        const item = res.data.find((x) => x.file_url || x.large_file_url);
        console.log("Hentai test:", item ? "OK" : "No item");
    } catch(e) {
        console.log("Hentai test error:", e.message);
    }
}

async function testHantu() {
    try {
        const p = await ab.pinterest('hantu pocong asli seram');
        console.log("Hantu test:", p && p.result && p.result.result && p.result.result.length > 0 ? "OK" : "No item");
    } catch(e) {
        console.log("Hantu test error:", e.message);
    }
}

testHentai();
testHantu();
