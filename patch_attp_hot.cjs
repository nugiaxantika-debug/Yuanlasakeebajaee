const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// ATTP fix
content = content.replace(
  "    } else if (body.startsWith(\".attp\") || body.startsWith(\"attp\")) {",
  "    } else if (body.startsWith(\".attp\") || body.startsWith(\"attp\")) {\n       const { Sticker } = require('wa-sticker-formatter');"
);
content = content.replace(
  "                 const { Sticker } = await import('wa-sticker-formatter');",
  ""
);

// videosexybikini fix
content = content.replace(
  "if (targetQuery === \"videosexybikini\") searchQuery = \"bikini haul\";",
  "if (targetQuery === \"videosexybikini\") {\n        const hotQueries = [\"bikinimodel\", \"bikini dance\", \"gravure idol\", \"swimsuit model\", \"bikini try on haul\"];\n        searchQuery = hotQueries[Math.floor(Math.random() * hotQueries.length)];\n      }"
);

fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Patched ATTP and videosexybikini");
