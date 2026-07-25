const axios = require('axios');
async function run() {
    const urls = [
          "https://i.pinimg.com/originals/98/d7/98/98d79852b910b2b9461dd75096ffe4e1.jpg",
          "https://i.pinimg.com/originals/e7/8a/cc/e78acc29b165b6a7b75ec177b9666d95.jpg",
          "https://i.pinimg.com/736x/88/54/1b/88541be5e63842c38d3845b41040ed53.jpg",
          "https://i.pinimg.com/originals/61/9b/6c/619b6c0da662409c768ac2480c7f8549.png",
          "https://i.pinimg.com/originals/f3/e6/78/f3e6789b70b329431c2605eb80352ff6.jpg",
          "https://i.pinimg.com/originals/ce/e3/e2/cee3e2261da2a51f893693f9de78aebf.jpg",
          "https://i.pinimg.com/736x/82/81/25/828125cf36c94cfd8591ef14092b7754.jpg",
          "https://i.pinimg.com/736x/f6/88/2c/f6882c7d9e8eb3f309a633dfb1de6cc3.jpg",
          "https://i.pinimg.com/736x/9f/51/77/9f517743d5cde78ff9d33261a868f00f.jpg",
          "https://i.pinimg.com/736x/fc/55/e5/fc55e59279dc6e8cc8de9708985ef4ed.jpg",
          "https://i.pinimg.com/736x/91/97/fb/9197fb94b7c6c40a3ddb4a0ca06d9d06.jpg",
          "https://i.pinimg.com/736x/9f/7a/74/9f7a744234c9c228d447d21fc98beff5.jpg",
          "https://i.pinimg.com/736x/cc/e9/8a/cce98ad970634ed1f2596ab293675005.jpg"
    ];
    for (const u of urls) {
        try {
            const res = await axios.head(u);
            console.log(u, res.status);
        } catch (e) {
            console.log(u, e.response ? e.response.status : e.message);
        }
    }
}
run();
