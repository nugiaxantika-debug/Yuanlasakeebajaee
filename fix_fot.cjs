const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

code = code.replace(
  `} else if (body.startsWith(".fot") || body.startsWith("fot")) {`,
  `} else if ((body.startsWith(".fot") || body.startsWith("fot")) && !body.startsWith(".foto") && !body.startsWith("foto")) {`
);

code = code.replace(
  `} else if (body.startsWith(".fotosexy") || body.startsWith("fotosexy") || body.startsWith(".fotoanime") || body.startsWith("fotoanime") || body.startsWith(".fotoip") || body.startsWith("fotoip")) {\n        // let the other handlers deal with this\n      }`,
  ``
);

fs.writeFileSync('src/services/whatsapp.ts', code, 'utf8');
