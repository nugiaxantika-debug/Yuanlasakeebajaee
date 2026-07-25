const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const deviceMenuUI = `
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-start gap-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 mt-1"><Smartphone className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">.devicemenu</h3>
                    <p className="text-xs text-neutral-400 mt-1">Cek informasi battery, deviceinfo, cpu, ram, storage, network, pingphone, sensor, apkinfo, dan appcheck.</p>
                  </div>
                </div>`;

code = code.replace(
  /<h3 className="font-semibold text-white text-sm">\.margamenu<\/h3>.*?<\/div>.*?<\/div>/s,
  match => match + deviceMenuUI
);

// add Smartphone icon if not imported
if (!code.includes('Smartphone')) {
    code = code.replace(/import \{([^}]+)\} from "lucide-react";/, "import {$1, Smartphone} from \"lucide-react\";");
}

fs.writeFileSync(file, code);
console.log('patched Dashboard.tsx');
