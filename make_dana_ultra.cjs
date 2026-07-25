const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
    const width = 1080;
    const height = 2400;

    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#f2f2f2" />
        
        <!-- Blue Header Background -->
        <rect width="${width}" height="${height * 0.35}" fill="#118EE9" />
        
        <!-- Status Bar -->
        <text x="100" y="80" font-family="sans-serif" font-size="36" fill="white" font-weight="bold">09:41</text>
        <circle cx="900" cy="70" r="15" fill="white" />
        <circle cx="950" cy="70" r="15" fill="white" />
        <rect x="990" y="55" width="40" height="30" rx="8" fill="white" />
        
        <!-- Top Nav (Logo, Balance, Promo Button) -->
        <!-- Logo -->
        <circle cx="100" cy="180" r="40" fill="white" />
        <!-- We will leave the balance area empty so the bot can write it -->
        
        <!-- Eye Icon (Hide balance) -->
        <circle cx="480" cy="180" r="18" fill="none" stroke="white" stroke-width="4" />
        <line x1="460" y1="200" x2="500" y2="160" stroke="white" stroke-width="4" />
        
        <!-- Promo Button (Cobain DANA+) -->
        <rect x="730" y="140" width="300" height="80" rx="40" fill="url(#grad1)" />
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#4bb4ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#0d6bc9;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="black" flood-opacity="0.1"/>
            </filter>
        </defs>
        <text x="880" y="190" font-family="sans-serif" font-size="32" fill="white" font-weight="bold" text-anchor="middle">Cobain DANA+</text>
        
        <!-- 4 Main Action Buttons -->
        <!-- 1. Isi Saldo -->
        <rect x="130" y="270" width="80" height="80" rx="20" fill="none" stroke="white" stroke-width="6" />
        <text x="170" y="325" font-family="sans-serif" font-size="60" fill="white" text-anchor="middle" font-weight="bold">+</text>
        <text x="170" y="410" font-family="sans-serif" font-size="34" fill="white" text-anchor="middle" font-weight="bold">Isi Saldo</text>

        <!-- 2. Minta -->
        <rect x="380" y="270" width="80" height="80" rx="20" fill="none" stroke="white" stroke-width="6" />
        <text x="420" y="325" font-family="sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold">Rp</text>
        <text x="420" y="410" font-family="sans-serif" font-size="34" fill="white" text-anchor="middle" font-weight="bold">Minta</text>

        <!-- 3. Kirim -->
        <rect x="630" y="270" width="80" height="80" rx="20" fill="none" stroke="white" stroke-width="6" />
        <text x="670" y="325" font-family="sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold">Rp</text>
        <text x="670" y="410" font-family="sans-serif" font-size="34" fill="white" text-anchor="middle" font-weight="bold">Kirim</text>

        <!-- 4. Pesan -->
        <rect x="880" y="270" width="80" height="80" rx="20" fill="none" stroke="white" stroke-width="6" />
        <path d="M 880 290 L 920 320 L 960 290" fill="none" stroke="white" stroke-width="6" />
        <circle cx="960" cy="270" r="15" fill="red" />
        <text x="920" y="410" font-family="sans-serif" font-size="34" fill="white" text-anchor="middle" font-weight="bold">Pesan</text>

        <!-- Banner Promo (Akses DANA Bisa Tanpa Kuota) -->
        <rect x="40" y="480" width="1000" height="220" rx="30" fill="#25a3ff" />
        <text x="540" y="550" font-family="sans-serif" font-size="40" fill="white" font-weight="bold" text-anchor="middle">Akses DANA</text>
        <text x="540" y="600" font-family="sans-serif" font-size="40" fill="white" font-weight="bold" text-anchor="middle">Bisa Tanpa Kuota!</text>
        <rect x="390" y="620" width="300" height="60" rx="30" fill="#fc5b5b" />
        <text x="540" y="660" font-family="sans-serif" font-size="30" fill="white" font-weight="bold" text-anchor="middle">BELI YUK</text>

        <!-- Main Menu Grid (White Card) -->
        <rect x="40" y="730" width="1000" height="500" rx="40" fill="white" filter="url(#shadow)" />
        
        <!-- Row 1 -->
        <circle cx="170" cy="850" r="50" fill="#e0f2fe" />
        <text x="170" y="940" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">Google Play</text>
        <text x="170" y="980" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">Zone</text>

        <circle cx="415" cy="850" r="50" fill="#e0f2fe" />
        <text x="415" y="940" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">A+ Rewards</text>

        <circle cx="660" cy="850" r="50" fill="#e0f2fe" />
        <text x="660" y="940" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">Travel</text>

        <circle cx="905" cy="850" r="50" fill="#ffedd5" />
        <text x="905" y="940" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">Listrik</text>

        <!-- Row 2 -->
        <circle cx="170" cy="1070" r="50" fill="#fee2e2" />
        <text x="170" y="1160" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">Pulsa &amp; Data</text>

        <circle cx="415" cy="1070" r="50" fill="#e0f2fe" />
        <text x="415" y="1160" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">DANA Kaget</text>

        <circle cx="660" cy="1070" r="50" fill="#ffedd5" />
        <text x="660" y="1160" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">Bayar Cicilan</text>

        <circle cx="905" cy="1070" r="50" fill="#f3f4f6" />
        <circle cx="890" cy="1055" r="10" fill="#888" />
        <circle cx="920" cy="1055" r="10" fill="#888" />
        <circle cx="890" cy="1085" r="10" fill="#888" />
        <circle cx="920" cy="1085" r="10" fill="#888" />
        <text x="905" y="1160" font-family="sans-serif" font-size="28" fill="#555" text-anchor="middle">Lihat Semua</text>

        <!-- Feed Section -->
        <rect x="40" y="1260" width="1000" height="380" rx="40" fill="white" filter="url(#shadow)" />
        
        <circle cx="110" cy="1330" r="25" fill="#118EE9" />
        <text x="170" y="1340" font-family="sans-serif" font-size="32" fill="#222" font-weight="bold">Feed</text>
        <text x="260" y="1340" font-family="sans-serif" font-size="32" fill="#555">hai 👋, siap menjelajah feed?</text>
        <path d="M 920 1320 L 950 1330 L 920 1340 Z" fill="#118EE9" />

        <circle cx="110" cy="1410" r="25" fill="#118EE9" />
        <text x="170" y="1420" font-family="sans-serif" font-size="32" fill="#222" font-weight="bold">Feed</text>
        <text x="260" y="1420" font-family="sans-serif" font-size="32" fill="#555">masuk untuk lihat update terbaru!</text>
        <path d="M 920 1400 L 950 1410 L 920 1420 Z" fill="#118EE9" />

        <circle cx="110" cy="1490" r="25" fill="#118EE9" />
        <text x="170" y="1500" font-family="sans-serif" font-size="32" fill="#222" font-weight="bold">Feed</text>
        <text x="260" y="1500" font-family="sans-serif" font-size="32" fill="#555">berikan 💬, ❤️, 🎁 biar seru!</text>
        <path d="M 920 1480 L 950 1490 L 920 1500 Z" fill="#118EE9" />

        <circle cx="110" cy="1570" r="25" fill="#118EE9" />
        <text x="170" y="1580" font-family="sans-serif" font-size="32" fill="#222" font-weight="bold">Feed</text>
        <text x="260" y="1580" font-family="sans-serif" font-size="32" fill="#555">sambungkan koneksi yang terpercaya!</text>
        <path d="M 920 1560 L 950 1570 L 920 1580 Z" fill="#118EE9" />

        <!-- DANA Protection Banner -->
        <rect x="40" y="1670" width="1000" height="400" rx="40" fill="#0c4a6e" />
        <text x="540" y="1850" font-family="sans-serif" font-size="60" fill="white" font-weight="bold" text-anchor="middle">JAMINAN</text>
        <text x="540" y="1930" font-family="sans-serif" font-size="70" fill="white" font-weight="bold" text-anchor="middle">ANTI PENDING</text>

        <!-- Bottom Navigation -->
        <rect x="0" y="2180" width="1080" height="220" fill="white" filter="url(#shadow)" />
        
        <circle cx="120" cy="2250" r="25" fill="#555" />
        <text x="120" y="2320" font-family="sans-serif" font-size="30" fill="#555" text-anchor="middle" font-weight="bold">Beranda</text>
        
        <rect x="290" y="2220" width="40" height="50" fill="none" stroke="#555" stroke-width="6" rx="10" />
        <text x="310" y="2320" font-family="sans-serif" font-size="30" fill="#555" text-anchor="middle" font-weight="bold">Aktivitas</text>
        
        <circle cx="540" cy="2180" r="90" fill="#118EE9" />
        <text x="540" y="2240" font-family="sans-serif" font-size="30" fill="white" text-anchor="middle" font-weight="bold">PAY</text>

        <rect x="730" y="2225" width="50" height="40" fill="none" stroke="#555" stroke-width="6" rx="8" />
        <text x="755" y="2320" font-family="sans-serif" font-size="30" fill="#555" text-anchor="middle" font-weight="bold">Dompet</text>
        
        <circle cx="960" cy="2230" r="20" fill="none" stroke="#555" stroke-width="6" />
        <path d="M 930 2280 Q 960 2250 990 2280" fill="none" stroke="#555" stroke-width="6" />
        <text x="960" y="2320" font-family="sans-serif" font-size="30" fill="#555" text-anchor="middle" font-weight="bold">Saya</text>
    </svg>
    `;

    fs.mkdirSync(path.join(process.cwd(), 'public', 'templates'), { recursive: true });
    await sharp(Buffer.from(svg)).png().toFile(path.join(process.cwd(), 'public', 'templates', 'fakedana.png'));
    console.log("Created fakedana.png template.");
}

run();
