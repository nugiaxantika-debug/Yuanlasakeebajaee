const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const templates = [
    { name: 'fakedana', color: '#118EE9', title: 'DANA' },
    { name: 'fakegopay', color: '#00AED6', title: 'GoPay' },
    { name: 'fakeovo', color: '#4C2A86', title: 'OVO' },
    { name: 'fakeshopeepay', color: '#EE4D2D', title: 'ShopeePay' },
    { name: 'fakebrimo', color: '#00529C', title: 'BRImo' },
    { name: 'fakeseabank', color: '#FF7A00', title: 'SeaBank' },
    { name: 'fakelivin', color: '#FFCA08', title: 'Livin' }
];

async function run() {
    fs.mkdirSync('public/templates', { recursive: true });
    for (let t of templates) {
        const svg = `
        <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
            <rect width="1080" height="1920" fill="#f5f5f5" />
            <!-- Header -->
            <rect width="1080" height="480" fill="${t.color}" />
            <text x="100" y="60" font-family="sans-serif" font-size="36" fill="${t.name === 'fakelivin' ? 'black' : 'white'}" font-weight="bold">09:41</text>
            <text x="540" y="80" font-family="sans-serif" font-size="40" fill="${t.name === 'fakelivin' ? 'black' : 'white'}" font-weight="bold" text-anchor="middle">${t.title}</text>
            
            <text x="100" y="180" font-family="sans-serif" font-size="36" fill="${t.name === 'fakelivin' ? 'black' : 'white'}">Saldo / Balance</text>
            
            <rect x="60" y="420" width="960" height="240" rx="30" fill="white" />
            <circle cx="190" cy="500" r="40" fill="${t.color}" fill-opacity="0.2" />
            <circle cx="423" cy="500" r="40" fill="${t.color}" fill-opacity="0.2" />
            <circle cx="656" cy="500" r="40" fill="${t.color}" fill-opacity="0.2" />
            <circle cx="890" cy="500" r="40" fill="${t.color}" fill-opacity="0.2" />
            
            <rect x="60" y="700" width="960" height="300" rx="30" fill="#ffffff" />
            <rect x="100" y="800" width="880" height="160" rx="20" fill="${t.color}" fill-opacity="0.1" />
            
            <rect x="0" y="1740" width="1080" height="180" fill="white" />
        </svg>
        `;
        await sharp(Buffer.from(svg)).png().toFile(`public/templates/${t.name}_base.png`);
        console.log(`Created ${t.name}_base.png`);
    }
}
run();
