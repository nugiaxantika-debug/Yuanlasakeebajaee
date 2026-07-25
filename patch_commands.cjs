const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.ts', 'utf8');

// 1. Update stickerCommands
content = content.replace(
  "const stickerCommands = ['.stickermenu', 'stickermenu', '.stiker', 'stiker', '.hd', 'hd', '.brat', 'brat', '.bratvid', 'bratvid', '.smeme', 'smeme', '.qc', 'qc', '.toimg', 'toimg', '.togif', 'togif', '.stikerrandom', 'stikerrandom', '.stikerspongebob', 'stikerspongebob', '.iqc', 'iqc', '.tovideo', 'tovideo', '.rvo', 'rvo', '.hdvid', 'hdvid', '.emojimix', 'emojimix', '.emojigif', 'emojigif', '.bratgambar', 'bratgambar', '.fotoip', 'fotoip'];",
  "const stickerCommands = ['.stickermenu', 'stickermenu', '.stiker', 'stiker', '.hd', 'hd', '.brat', 'brat', '.bratvid', 'bratvid', '.smeme', 'smeme', '.qc', 'qc', '.toimg', 'toimg', '.togif', 'togif', '.stikerrandom', 'stikerrandom', '.stikerspongebob', 'stikerspongebob', '.iqc', 'iqc', '.tovideo', 'tovideo', '.rvo', 'rvo', '.hdvid', 'hdvid', '.emojimix', 'emojimix', '.emojigif', 'emojigif', '.bratgambar', 'bratgambar', '.fotoip', 'fotoip', '.attp', 'attp', '.logo', 'logo', '.wallpaper', 'wallpaper', '.fotoandroid', 'fotoandroid'];"
);

// 2. Update downloadCommands
content = content.replace(
  "const downloadCommands = ['.downloadmenu', 'downloadmenu', '.tiktok', 'tiktok', '.tiktokaudiomp3', 'tiktokaudiomp3', '.playyt', 'playyt', '.playytmp4', 'playytmp4', '.capcut', 'capcut', '.facebook', 'facebook', '.instagram', 'instagram', '.fotosexy', 'fotosexy', '.fotoanime', 'fotoanime', '.pinterest', 'pinterest', '.ttsaudio', 'ttsaudio', '.tiktokslide', 'tiktokslide', '.ssweb', 'ssweb', '.gdrive', 'gdrive', '.mediafire', 'mediafire'];",
  "const downloadCommands = ['.downloadmenu', 'downloadmenu', '.tiktok', 'tiktok', '.tiktokaudiomp3', 'tiktokaudiomp3', '.playyt', 'playyt', '.playytmp4', 'playytmp4', '.capcut', 'capcut', '.facebook', 'facebook', '.instagram', 'instagram', '.fotosexy', 'fotosexy', '.fotoanime', 'fotoanime', '.pinterest', 'pinterest', '.ttsaudio', 'ttsaudio', '.tiktokslide', 'tiktokslide', '.ssweb', 'ssweb', '.gdrive', 'gdrive', '.mediafire', 'mediafire', '.videosexybikini', 'videosexybikini'];"
);

// 3. Update stickerText
content = content.replace(
  "│ .fotoip - buat foto notifikasi teks`;",
  "│ .fotoip - buat foto notifikasi teks\n│ .attp - buat stiker teks animasi warna warni\n│ .logo - buat logo text\n│ .wallpaper - cari wallpaper keren\n│ .fotoandroid - buat foto notifikasi android`;"
);

// 4. Update downloadText
content = content.replace(
  "│ .mediafire - download mediafire`;",
  "│ .mediafire - download mediafire\n│ .videosexybikini - download video sexy bikini random`;"
);

fs.writeFileSync('src/services/whatsapp.ts', content);
console.log("Commands and Menus updated.");
