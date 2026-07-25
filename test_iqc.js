const axios = require('axios');
const fs = require('fs');
async function test() {
  try {
    const res = await axios.get("https://api.betabotz.eu.org/api/maker/iqc?text=Halo&apikey=beta-haikalisme");
    console.log(Object.keys(res.data));
  } catch(e) { console.log(e.response ? e.response.data : e.message); }
}
test();
