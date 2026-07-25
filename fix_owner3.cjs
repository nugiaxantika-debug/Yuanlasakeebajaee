const fs = require('fs');
let code = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// The issue is probably with how isOwner checks are scattered or how ownerCommands are processed. 
// "Tetapi kenapa saat no tersebut digunakan untuk akses fitur di ownermenu tidak merespon juga fitur owner akses ditolak"
