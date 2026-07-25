const sharp = require('sharp');
const fs = require('fs');

async function createDanaTemplate() {
    const width = 1080;
    const height = 1920;
    
    // SVG for a realistic DANA app template
    // Note: We use a placeholder for the balance so we can overwrite it, or we just leave it blank and add it in the bot.
    // We will leave the balance area blank so the bot can just add text!
    // But the user said "yang RP 14.841 bisa berubah", so maybe we create a template that ALREADY looks complete except for the text.
    const svg = `
        <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="1080" height="1920" fill="#f5f5f5" />
            
            <!-- Blue Header -->
            <rect width="1080" height="480" fill="#118EE9" />
            
            <!-- Status Bar -->
            <text x="100" y="60" font-family="sans-serif" font-size="36" fill="white" font-weight="bold">09:41</text>
            <rect x="920" y="30" width="60" height="30" rx="10" fill="transparent" stroke="white" stroke-width="4"/>
            <rect x="926" y="36" width="48" height="18" rx="5" fill="white"/>
            
            <!-- Top Icons (Scan, Pay, etc) -->
            <!-- Profile circle -->
            <circle cx="100" cy="180" r="40" fill="#ffffff" fill-opacity="0.2" />
            <circle cx="100" cy="180" r="20" fill="white" />
            
            <!-- "Rp" text -->
            <text x="170" y="160" font-family="sans-serif" font-size="36" fill="white">Rp</text>
            <!-- The balance will be written by the bot around x="170" y="240" font-size="80" -->
            
            <!-- "Tap to hide balance" -->
            <circle cx="170" cy="280" r="15" fill="white" fill-opacity="0.5" />
            
            <!-- Quick Action Buttons Box -->
            <rect x="60" y="420" width="960" height="240" rx="30" fill="white" />
            
            <!-- Button 1: Scan -->
            <circle cx="190" cy="500" r="40" fill="#118EE9" fill-opacity="0.1" />
            <text x="190" y="580" font-family="sans-serif" font-size="28" fill="#333" text-anchor="middle">Scan</text>
            
            <!-- Button 2: Top Up -->
            <circle cx="423" cy="500" r="40" fill="#118EE9" fill-opacity="0.1" />
            <text x="423" y="580" font-family="sans-serif" font-size="28" fill="#333" text-anchor="middle">Isi Saldo</text>
            
            <!-- Button 3: Send -->
            <circle cx="656" cy="500" r="40" fill="#118EE9" fill-opacity="0.1" />
            <text x="656" y="580" font-family="sans-serif" font-size="28" fill="#333" text-anchor="middle">Kirim</text>
            
            <!-- Button 4: Request -->
            <circle cx="890" cy="500" r="40" fill="#118EE9" fill-opacity="0.1" />
            <text x="890" y="580" font-family="sans-serif" font-size="28" fill="#333" text-anchor="middle">Minta</text>
            
            <!-- Feed / Promo Banner -->
            <rect x="60" y="700" width="960" height="300" rx="30" fill="#ffffff" />
            <text x="100" y="760" font-family="sans-serif" font-size="40" fill="#333" font-weight="bold">DANA Promo</text>
            <rect x="100" y="800" width="880" height="160" rx="20" fill="#118EE9" fill-opacity="0.1" />
            <text x="140" y="880" font-family="sans-serif" font-size="32" fill="#118EE9" font-weight="bold">Dapatkan Cashback 50%!</text>
            
            <!-- Recent Transactions -->
            <text x="60" y="1080" font-family="sans-serif" font-size="40" fill="#333" font-weight="bold">Terbaru</text>
            <rect x="60" y="1120" width="960" height="150" rx="20" fill="#ffffff" />
            <circle cx="120" cy="1195" r="40" fill="#ff4d4f" fill-opacity="0.1" />
            <text x="200" y="1180" font-family="sans-serif" font-size="36" fill="#333" font-weight="bold">Kirim DANA</text>
            <text x="200" y="1225" font-family="sans-serif" font-size="28" fill="#888">Berhasil</text>
            <text x="980" y="1195" font-family="sans-serif" font-size="36" fill="#333" font-weight="bold" text-anchor="end">- Rp 50.000</text>
            
            <!-- Bottom Navigation -->
            <rect x="0" y="1740" width="1080" height="180" fill="white" />
            <text x="135" y="1820" font-family="sans-serif" font-size="30" fill="#118EE9" font-weight="bold" text-anchor="middle">Beranda</text>
            <text x="405" y="1820" font-family="sans-serif" font-size="30" fill="#888" text-anchor="middle">Riwayat</text>
            <text x="675" y="1820" font-family="sans-serif" font-size="30" fill="#888" text-anchor="middle">Pay</text>
            <text x="945" y="1820" font-family="sans-serif" font-size="30" fill="#888" text-anchor="middle">Saya</text>
        </svg>
    `;
    
    fs.mkdirSync('public/templates', { recursive: true });
    await sharp(Buffer.from(svg))
        .png()
        .toFile('public/templates/fakedana_base.png');
    console.log("Template base created!");
}

createDanaTemplate();
