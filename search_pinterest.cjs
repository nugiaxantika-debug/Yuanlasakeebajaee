const ab = require("ab-downloader");

async function run() {
    const ghosts = ['pocong', 'kuntilanak', 'genderuwo', 'wewe gombel', 'tuyul', 'sundel bolong', 'palasik', 'kuyang', 'banaspati', 'jelangkung', 'siluman', 'nyi roro kidul', 'gundul pringis'];
    
    for (const g of ghosts) {
        try {
            const p = await ab.pinterest(g + ' horror');
            if (p && p.result && p.result.result && p.result.result.length > 0) {
                console.log(g, p.result.result[0].image_url);
            } else {
                console.log(g, 'not found');
            }
        } catch (e) {
            console.log(g, 'error');
        }
    }
}
run();
