const axios = require('axios');
async function run() {
    try {
        const response = await axios.post("https://luminai.my.id/", { content: "halo siapa kamu?" });
        console.log("Success:", response.data);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
run();
