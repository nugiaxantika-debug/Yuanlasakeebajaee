const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');
console.log("Ends with:");
console.log(content.slice(-50));
