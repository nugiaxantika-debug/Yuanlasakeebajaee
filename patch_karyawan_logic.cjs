const fs = require('fs');

const file = 'src/services/whatsapp.ts';
let code = fs.readFileSync(file, 'utf8');

const logic = `
    } else if (body.startsWith(".addproduk") || body.startsWith("addproduk")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya owner yang dapat mengelola produk!" }, { quoted: msg });
      const args = messageContent.replace(/^\\.?addproduk\\s*/i, "").split("|");
      if (args.length < 3) return await this.sock.sendMessage(jid, { text: "Format salah!\\nContoh: .addproduk ID_Produk | Nama Produk | Harga" }, { quoted: msg });
      const id = args[0].trim().toLowerCase();
      const nama = args[1].trim();
      const harga = parseInt(args[2].trim().replace(/\\D/g, ''));
      
      this.karyawanData.produk[id] = { nama, harga, stok: 0 };
      this.saveKaryawanData();
      await this.sock.sendMessage(jid, { text: \`✅ Produk berhasil ditambahkan:\\n\\nID: \${id}\\nNama: \${nama}\\nHarga: Rp \${harga.toLocaleString('id-ID')}\` }, { quoted: msg });

    } else if (body.startsWith(".delproduk") || body.startsWith("delproduk")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya owner yang dapat mengelola produk!" }, { quoted: msg });
      const id = messageContent.replace(/^\\.?delproduk\\s*/i, "").trim().toLowerCase();
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: \`❌ Produk dengan ID \${id} tidak ditemukan.\` }, { quoted: msg });
      
      delete this.karyawanData.produk[id];
      this.saveKaryawanData();
      await this.sock.sendMessage(jid, { text: \`✅ Produk \${id} berhasil dihapus.\` }, { quoted: msg });

    } else if (body === ".listproduk" || body === "listproduk") {
      const produkKeys = Object.keys(this.karyawanData.produk);
      if (produkKeys.length === 0) return await this.sock.sendMessage(jid, { text: "📦 Daftar produk kosong." }, { quoted: msg });
      
      let txt = "📦 *Daftar Produk*\\n\\n";
      for (const key of produkKeys) {
        const p = this.karyawanData.produk[key];
        txt += \`• ID: \${key}\\n  Nama: \${p.nama}\\n  Harga: Rp \${p.harga.toLocaleString('id-ID')}\\n  Stok: \${p.stok}\\n\\n\`;
      }
      await this.sock.sendMessage(jid, { text: txt.trim() }, { quoted: msg });

    } else if (body.startsWith(".cekproduk") || body.startsWith("cekproduk")) {
      const id = messageContent.replace(/^\\.?cekproduk\\s*/i, "").trim().toLowerCase();
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: \`❌ Produk dengan ID \${id} tidak ditemukan.\` }, { quoted: msg });
      
      const p = this.karyawanData.produk[id];
      await this.sock.sendMessage(jid, { text: \`📦 *Info Produk*\\n\\nID: \${id}\\nNama: \${p.nama}\\nHarga: Rp \${p.harga.toLocaleString('id-ID')}\\nStok: \${p.stok}\` }, { quoted: msg });

    } else if (body.startsWith(".hargaproduk") || body.startsWith("hargaproduk")) {
      const id = messageContent.replace(/^\\.?hargaproduk\\s*/i, "").trim().toLowerCase();
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: \`❌ Produk dengan ID \${id} tidak ditemukan.\` }, { quoted: msg });
      
      const p = this.karyawanData.produk[id];
      await this.sock.sendMessage(jid, { text: \`💰 *Harga Produk*\\n\\nNama: \${p.nama}\\nHarga: Rp \${p.harga.toLocaleString('id-ID')}\` }, { quoted: msg });

    } else if (body.startsWith(".addstok") || body.startsWith("addstok") || body.startsWith(".restock") || body.startsWith("restock") || body.startsWith(".updatestok") || body.startsWith("updatestok")) {
      if (!isOwner && !jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin / owner!" }, { quoted: msg });
      const args = messageContent.replace(/^\\.?(addstok|restock|updatestok)\\s*/i, "").split("|");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Format salah!\\nContoh: .addstok ID_Produk | Jumlah" }, { quoted: msg });
      
      const id = args[0].trim().toLowerCase();
      const jumlah = parseInt(args[1].trim());
      if (isNaN(jumlah)) return await this.sock.sendMessage(jid, { text: "Jumlah harus berupa angka!" }, { quoted: msg });
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: \`❌ Produk dengan ID \${id} tidak ditemukan.\` }, { quoted: msg });
      
      if (body.startsWith(".updatestok") || body.startsWith("updatestok")) {
        this.karyawanData.produk[id].stok = jumlah;
      } else {
        this.karyawanData.produk[id].stok += jumlah;
      }
      this.saveKaryawanData();
      await this.sock.sendMessage(jid, { text: \`✅ Stok berhasil diperbarui!\\n\\nProduk: \${this.karyawanData.produk[id].nama}\\nStok saat ini: \${this.karyawanData.produk[id].stok}\` }, { quoted: msg });

    } else if (body.startsWith(".cekstok") || body.startsWith("cekstok")) {
      const id = messageContent.replace(/^\\.?cekstok\\s*/i, "").trim().toLowerCase();
      if (!id) {
         let txt = "📦 *Stok Produk*\\n\\n";
         for (const key of Object.keys(this.karyawanData.produk)) {
           txt += \`• \${this.karyawanData.produk[key].nama}: \${this.karyawanData.produk[key].stok}\\n\`;
         }
         return await this.sock.sendMessage(jid, { text: txt.trim() || "Daftar produk kosong." }, { quoted: msg });
      }
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: \`❌ Produk dengan ID \${id} tidak ditemukan.\` }, { quoted: msg });
      
      const p = this.karyawanData.produk[id];
      await this.sock.sendMessage(jid, { text: \`📦 *Cek Stok*\\n\\nNama: \${p.nama}\\nStok: \${p.stok}\` }, { quoted: msg });

    } else if (body.startsWith(".penjualan") || body.startsWith("penjualan")) {
      if (!isOwner && !jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin / owner!" }, { quoted: msg });
      const args = messageContent.replace(/^\\.?penjualan\\s*/i, "").split("|");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Format salah!\\nContoh: .penjualan ID_Produk | Jumlah" }, { quoted: msg });
      
      const id = args[0].trim().toLowerCase();
      const jumlah = parseInt(args[1].trim());
      if (isNaN(jumlah)) return await this.sock.sendMessage(jid, { text: "Jumlah harus berupa angka!" }, { quoted: msg });
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: \`❌ Produk dengan ID \${id} tidak ditemukan.\` }, { quoted: msg });
      if (this.karyawanData.produk[id].stok < jumlah) return await this.sock.sendMessage(jid, { text: \`❌ Stok tidak mencukupi! Stok saat ini: \${this.karyawanData.produk[id].stok}\` }, { quoted: msg });
      
      this.karyawanData.produk[id].stok -= jumlah;
      const total = this.karyawanData.produk[id].harga * jumlah;
      const tanggal = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      const kasir = msg.key.participant || msg.key.remoteJid;
      
      this.karyawanData.riwayat.push({ tanggal, produk: id, jumlah, total, kasir });
      this.saveKaryawanData();
      
      await this.sock.sendMessage(jid, { text: \`✅ *Penjualan Berhasil*\\n\\nProduk: \${this.karyawanData.produk[id].nama}\\nJumlah: \${jumlah}\\nTotal: Rp \${total.toLocaleString('id-ID')}\\nSisa Stok: \${this.karyawanData.produk[id].stok}\\nTanggal: \${tanggal}\` }, { quoted: msg });

    } else if (body.startsWith(".strukpembayaran") || body.startsWith("strukpembayaran")) {
      if (this.karyawanData.riwayat.length === 0) return await this.sock.sendMessage(jid, { text: "Belum ada data penjualan." }, { quoted: msg });
      const lastSales = this.karyawanData.riwayat[this.karyawanData.riwayat.length - 1];
      const prod = this.karyawanData.produk[lastSales.produk];
      const nama = prod ? prod.nama : lastSales.produk;
      
      const struk = \`🧾 *STRUK PEMBAYARAN*\\n\\nTanggal: \${lastSales.tanggal}\\nKasir: @\${lastSales.kasir.split("@")[0]}\\n--------------------------\\nItem: \${nama}\\nJumlah: \${lastSales.jumlah}\\nHarga Satuan: Rp \${(lastSales.total / lastSales.jumlah).toLocaleString('id-ID')}\\n--------------------------\\nTotal: Rp \${lastSales.total.toLocaleString('id-ID')}\\n\\nTerima kasih telah berbelanja!\`;
      await this.sock.sendMessage(jid, { text: struk, mentions: [lastSales.kasir] }, { quoted: msg });

    } else if (body === ".riwayatjual" || body === "riwayatjual") {
      if (this.karyawanData.riwayat.length === 0) return await this.sock.sendMessage(jid, { text: "Belum ada riwayat penjualan." }, { quoted: msg });
      
      let txt = "📜 *Riwayat Penjualan (10 Terakhir)*\\n\\n";
      const recent = this.karyawanData.riwayat.slice(-10);
      for (const r of recent) {
         const p = this.karyawanData.produk[r.produk];
         txt += \`• \${r.tanggal}\\n  \${p ? p.nama : r.produk} (\${r.jumlah}x) - Rp \${r.total.toLocaleString('id-ID')}\\n\\n\`;
      }
      await this.sock.sendMessage(jid, { text: txt.trim() }, { quoted: msg });

    } else if (body === ".laporan" || body === "laporan") {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya owner yang dapat melihat laporan!" }, { quoted: msg });
      
      let totalPendapatan = 0;
      let totalItem = 0;
      for (const r of this.karyawanData.riwayat) {
        totalPendapatan += r.total;
        totalItem += r.jumlah;
      }
      
      await this.sock.sendMessage(jid, { text: \`📊 *Laporan Penjualan Keseluruhan*\\n\\nTotal Transaksi: \${this.karyawanData.riwayat.length}\\nTotal Item Terjual: \${totalItem}\\nTotal Pendapatan: Rp \${totalPendapatan.toLocaleString('id-ID')}\` }, { quoted: msg });

    } else if (body.startsWith(".konfirmasi") || body.startsWith("konfirmasi")) {
      const order = messageContent.replace(/^\\.?konfirmasi\\s*/i, "").trim();
      await this.sock.sendMessage(jid, { text: \`✅ *Konfirmasi Diterima*\\n\\nPesanan/Aksi: \${order}\\nTelah dikonfirmasi oleh staf.\` }, { quoted: msg });`;

const idx = code.indexOf(`} else if (body.startsWith(".done") || body.startsWith("done")) {`);
const doneHandlerEnd = code.indexOf(`} else if (body.startsWith(".jeda") || body.startsWith("jeda")) {`, idx);

if (doneHandlerEnd !== -1) {
    const newCode = code.slice(0, doneHandlerEnd) + logic + "\n" + code.slice(doneHandlerEnd);
    fs.writeFileSync(file, newCode, 'utf8');
    console.log('Successfully patched!');
} else {
    console.log('Could not find injection point');
}
