# Bakso Len 1 — E-Katalog
Kandidat awal. Bukan sistem POS, marketplace, atau penerima pembayaran. Menu publik → troli → WhatsApp kurir. Harga dan stok Google Sheets, API GAS read-only, frontend GitHub Pages.

## Status
- 25 entri menu dari KB Batch 5 (26 Nov 2026); perlu rekonsiliasi dengan dua foto asli. Badge Best berdasarkan blueprint, belum disahkan. Minuman Botolan dikelompokkan seperti sumber. Semua seed tidak terverifikasi dan tidak dapat dipesan.
- API_URL terisi deployment GAS v1 dari Owner; koneksi live diuji melalui CI. Pemesanan tetap mengikuti status toko dan kurir dari database. Tidak ada kurir contoh atau data pelanggan tersimpan.
- Logo BL dan desain warna sementara, bukan replika foto menu asli.
- Promo/game ditunda; tidak ada voucher palsu. PWA shell offline hanya untuk membaca katalog referensi. Browser Chromium 360px dengan data sintetis lulus pada 5bc334c; pemeriksaan browser live dan UAT perangkat nyata masih terpisah.

## Handoff Rakai
1. Buat spreadsheet privat `DB_Bakso_Len_1`, impor `data/menu.csv`, `data/kurir.csv`, `data/pengaturan.csv` ke tab `Menu`, `Kurir`, `Pengaturan`. Format harga/urutan sebagai angka tanpa pemisah, kolom WA dan jam sebagai teks biasa. Cek data dengan foto asli; ganti status HABIS menjadi READY hanya untuk item benar-benar tersedia. Jangan isi nomor kurir tanpa persetujuan publikasi. 
2. Buat Apps Script, salin `apps-script/Code.gs` dan manifest `appsscript.json`; set Script Property `DB_ID`. Deploy web app berjalan sebagai pemilik, akses Anyone hanya setelah pemeriksaan data yang diproyeksikan. Jangan buka akses spreadsheet. Endpoint JSON tanpa mutasi. Tidak ada doPost.
3. Berikan URL deployment `/exec` ke Sanusi untuk `js/config.js`, cek respons dari browser Pages (termasuk redirect/CORS). Jangan ubah status toko BUKA sebelum UAT dan izin.
4. Aktifkan Pages dari main setelah review, uji HP 360px, status toko tutup, perubahan harga/stok, kurir tidak aktif, offline dan pemesanan valid. Gunakan nomor kurir uji yang disetujui, jangan mengirim pesanan nyata tanpa izin.
5. Foto asli dan logo disimpan privat dulu, lalu aset publik yang telah disetujui ditempatkan pada assets/; API hanya memberi URL publik HTTPS. 

## API v1
`{ok:true,schema:1,generated_at:ISO,store:{open:boolean,jam_buka:"09:00",jam_tutup:"19:30",timezone:"Asia/Jakarta"},menu:[{id_menu,kategori,nama_menu,deskripsi,harga_porsi:number|null,harga_satuan:number|null,badge,status,foto_url,urutan}],kurir:[{id_kurir,nama_kurir,whatsapp,area_layanan,urutan}]}`. Error `{ok:false,error:"CATALOG_UNAVAILABLE"}`. GET tanpa credentials. Waktu tutup eksklusif. Status toko dan harga dicek kembali sebelum deep link WA; karena tidak ada order server, pesanan baru sah setelah kurir mengonfirmasi. Tidak mengklaim WA dikirim otomatis; pengguna tekan Kirim. 

## Test
`npm test` (Node 22, tanpa dependency). `python -m http.server 8000` untuk inspeksi lokal. Deploy Pages hanya setelah audit dan persetujuan pemilik.

## Flyer preview r5
Food-delivery-inspired green/white visual system with real Bakso Len logo and storefront asset from the project folder. Featured selections and prices derive from menu data. Individual photos render only when `foto_url` is supplied. Promo video requires a verified direct public video URL in flyer-r5/media.js; hidden by default. Preview worker retired; offline install is not enabled pending stable release. Live API returning HTML remains a separate failing integration check.
