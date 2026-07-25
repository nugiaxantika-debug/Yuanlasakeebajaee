const axios = require('axios');
async function test() {
    const ghosts = ['Pocong', 'Kuntilanak', 'Genderuwo', 'Wewe Gombel', 'Tuyul', 'Sundel bolong', 'Kuyang', 'Banaspati'];
    for (const g of ghosts) {
        const url = `https://id.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(g)}&pithumbsize=500`;
        const res = await axios.get(url);
        const pages = res.data.query.pages;
        const pageId = Object.keys(pages)[0];
        console.log(g, pageId !== "-1" && pages[pageId].thumbnail ? pages[pageId].thumbnail.source : 'Not found');
    }
}
test();
