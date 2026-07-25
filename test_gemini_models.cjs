const axios = require('axios');
require('dotenv/config');

async function test() {
    try {
        const key = process.env.GEMINI_API_KEY;
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        console.log("Models:", res.data.models.map(m => m.name).join(', '));
    } catch (e) {
        console.log("Error:", e.message, e.response?.data);
    }
}
test();
