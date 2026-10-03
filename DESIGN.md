# Dompeto — Design Specification

Status: implementasi revamp tersedia; verifikasi Safari fisik dan visual browser masih tertunda. Lihat [VERIFY.md](VERIFY.md).

Tanggal: 3 Oktober 2026.

Bahasa produk: Bahasa Indonesia. Mata uang: rupiah. Zona waktu: Asia/Jakarta.

## 1. Tujuan dan keputusan

Dompeto membantu pengguna mencatat pengeluaran dan gaji, memahami sisa anggaran, serta meninjau transaksi dengan cepat dari HP. Revamp memprioritaskan Safari iPhone dan kenyamanan membaca di ruangan redup.

Keputusan yang telah dikonfirmasi pengguna:

- Tema charcoal dengan aksen sage.
- Revamp UI/UX seluruh halaman, perbaikan bug, dan tambahan input manual.
- Ketik AI tetap menjadi cara input pertama; Manual dan Scan tersedia sebagai alternatif.
- Beranda menonjolkan sisa anggaran dalam siklus gaji.
- Anggaran adalah batas belanja tetap. Pemasukan tidak menambah batas tersebut.

Rincian desain di bawah menjadi default implementasi. Otomatisasi gaji, sinkronisasi bank, multiakun, tema terang, dan perubahan skema database berada di luar revamp ini. Desktop tetap responsif, dengan prioritas interaksi pada mobile.

## 2. Temuan pada implementasi sekarang

Audit dilakukan melalui kode, bukan reproduksi keyboard pada iPhone fisik.

| Temuan | Dampak | Arah perbaikan |
| --- | --- | --- |
| Input chat memakai `fixed bottom-20` dan halaman memakai `100vh` | Composer dapat tertutup keyboard atau menyisakan ruang yang keliru | Layout chat mengikuti viewport yang terlihat |
| Drawer menggabungkan batas `80vh`, `96dvh`, dan `100dvh` | Tinggi panel dan area scroll sulit diprediksi | Satu kontrak ukuran untuk panel form |
| Editor scan memakai scroll bertingkat dan `pb-80` | Scroll meloncat dan ruang kosong berlebihan | Satu area scroll, tanpa padding pengganti keyboard |
| Banyak label 6–10 px dan teks tebal-miring | Sulit dibaca, terutama saat layar redup | Skala tipografi konsisten dan teks normal |
| `.max-w-md` ditimpa menjadi 375 px pada mobile | Ruang layar HP yang lebih lebar tidak dimanfaatkan | Lebar fluid dan container khusus aplikasi |
| Safe area navigasi belum konsisten | Kontrol berisiko terlalu dekat home indicator | Padding menggunakan `env(safe-area-inset-*)` |
| Pengeluaran pada beberapa ringkasan dikurangi pemasukan | Pengguna sulit membedakan pengeluaran, arus kas, dan sisa anggaran | Pisahkan metrik dan samakan rumus |

Baseline `npm run lint`: 71 error dan 27 warning. Hasil ini dicatat sebelum implementasi revamp; bukan hasil validasi desain baru. Production build belum diperiksa dalam audit ini.

## 3. Prinsip pengalaman pengguna

1. **Jawaban utama langsung terlihat.** Pengguna dapat mengetahui sisa anggaran dan periode yang sedang dihitung tanpa membuka grafik.
2. **Pencatatan singkat, koreksi mudah.** Hasil AI selalu dapat diperiksa sebelum disimpan; input manual tersedia tanpa bergantung pada layanan AI.
3. **Keyboard adalah bagian dari layout.** Field aktif dan aksi utama tetap dapat dijangkau ketika keyboard terbuka.
4. **Gelap tetapi terbaca.** Hindari bidang putih besar, aksen neon, teks terlalu redup, dan blur yang mengurangi kejelasan.
5. **Angka memiliki konteks.** Selalu bedakan saldo keseluruhan, pemasukan, pengeluaran aktual, dan anggaran.
6. **Status dapat dipahami tanpa warna.** Gunakan teks, ikon, tanda nominal, dan label yang jelas.

## 4. Sistem visual

### Warna

Gunakan token semantik terpusat untuk halaman, portal dialog, dropdown, grafik, serta toast. Hubungkan token ke konfigurasi tema Tailwind v4; hindari nilai warna tersebar pada setiap komponen.

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `background` | `#141817` | Latar aplikasi |
| `surface` | `#1D2421` | Kartu dan panel |
| `surface-raised` | `#26312B` | Kontrol aktif dan permukaan bertingkat |
| `border` | `#35433B` | Pemisah dekoratif |
| `control-border` | `#6F8175` | Batas field/kontrol bila diperlukan untuk identifikasi |
| `foreground` | `#E7ECE8` | Teks utama |
| `muted-foreground` | `#A5B1AA` | Label dan teks sekunder |
| `primary` | `#A8C8AF` | Tombol utama, fokus, dan pilihan aktif |
| `primary-foreground` | `#18231B` | Teks pada tombol sage |
| `income` | `#A8C8AF` | Indikator pemasukan |
| `expense` | `#E2A099` | Indikator pengeluaran dan aksi destruktif |
| `warning` | `#D8BB83` | Peringatan anggaran |
| `info` | `#9DBACB` | Informasi pendukung |

Target kontras: teks normal minimal 4,5:1; teks besar dan indikator kontrol penting minimal 3:1. Verifikasi kombinasi aktual, termasuk hover, focus, placeholder, dan transparansi. Token `border` hanya untuk dekorasi, bukan satu-satunya penanda kontrol.

Gunakan `color-scheme: dark`. Warna browser, manifest, login, dan toast mengikuti tema agar tidak muncul bidang terang yang tidak disengaja.

### Tipografi dan angka

- Font tunggal: Geist, dengan fallback sans-serif sistem.
- Angka utama: 30–36 px, weight 600, `tabular-nums`; dapat membungkus tanpa memotong nilai.
- Judul halaman: 24 px/32 px, weight 600.
- Judul bagian: 18 px/26 px, weight 600.
- Isi: 14–16 px dengan line-height sekitar 1,5.
- Input mobile: minimal 16 px. Label sekunder dan navigasi: minimal 12 px.
- Gunakan sentence case. Hindari italic dan uppercase sebagai gaya default.
- Format nominal konsisten, misalnya `Rp 1.250.000`. Pada baris transaksi gunakan `+Rp 10.000.000` untuk pemasukan dan `−Rp 25.000` untuk pengeluaran.
- Jangan memendekkan nominal penting menjadi `1,2jt`; singkatan boleh untuk sumbu grafik, dengan nilai lengkap pada detail.

### Spasi, bentuk, dan gerak

- Skala spasi: 4, 8, 12, 16, 24, dan 32 px.
- Padding halaman mobile: 16 px; desktop: 24–32 px.
- Radius kartu: 16 px; field/tombol: 12 px; chip: penuh.
- Tinggi tombol utama dan field: 48 px. Semua target sentuh minimal 44 × 44 px, termasuk tombol ikon.
- Gunakan Lucide secara konsisten, ukuran 20–24 px untuk aksi utama.
- Bayangan tipis hanya untuk membedakan overlay. Hindari glow, efek tombol tiga dimensi, dan blur luas.
- Transisi warna/opacity 120–180 ms. Hormati `prefers-reduced-motion`; jangan menganimasi tinggi panel ketika keyboard bergerak.

## 5. Layout dan navigasi

### Mobile, di bawah 768 px

- Konten menggunakan lebar layar penuh, tanpa pembatas global 375 px.
- Navigasi bawah berisi **Beranda**, **Transaksi**, **Grafik**, dan **AI**, dengan ikon serta label.
- Pengaturan diakses melalui ikon berlabel aksesibel pada header halaman utama.
- Tombol **Catat** tersedia di Beranda dan Transaksi, pada area aksi di atas navigasi. Sisakan ruang konten sebesar tinggi area aksi dan navigasi agar baris terakhir tidak tertutup.
- Sembunyikan navigasi dan aksi Catat saat panel form terbuka atau keyboard terdeteksi; tampilkan kembali setelah konteks tersebut berakhir.
- Halaman biasa memakai satu scroll dokumen. Chat dan panel form masing-masing memiliki satu area scroll internal yang disengaja.

### Tablet dan desktop, mulai 768 px

- Navigasi berpindah ke sidebar dengan tujuan yang sama, termasuk akses Pengaturan.
- Area konten maksimal 1120 px; Beranda dan Grafik menggunakan dua kolom bila ruang cukup.
- Form tampil sebagai dialog maksimal 560 px dengan tinggi terbatas viewport; isi tetap dapat digulir.
- Tidak memperbesar seluruh UI menjadi tampilan HP yang diregangkan.

### Safe area dan aksesibilitas

- Gunakan `viewport-fit=cover` dan inset atas/bawah yang sesuai. Safe area tidak dipakai sebagai pengganti ukuran keyboard.
- Izinkan pinch-zoom; hapus pembatas `maximumScale: 1`.
- Berikan nama aksesibel untuk ikon, label field yang terhubung, focus ring yang terlihat, dan `aria-current` pada navigasi aktif.
- Dialog mengunci fokus, mendukung Escape di desktop, dan mengembalikan fokus ke pemicu setelah ditutup.

## 6. Spesifikasi per halaman

### Beranda

Urutan konten:

1. Header Dompeto dan akses Pengaturan.
2. Rentang siklus gaji aktif.
3. Kartu utama **Sisa anggaran**, progres pemakaian, dan jumlah hari sampai siklus berikutnya.
4. Pemasukan dan pengeluaran aktual dalam siklus, dengan label terpisah.
5. Pengeluaran hari ini dan saldo keseluruhan sebagai informasi sekunder.
6. Lima transaksi terbaru dan tautan **Lihat semua**.
7. Aksi **Catat** yang mudah dijangkau ibu jari.

Jika anggaran belum diatur, kartu utama menampilkan penjelasan dan aksi **Atur anggaran**. Jangan menampilkan indikator aman atau kelebihan belanja berdasarkan batas nol yang belum dikonfigurasi.

### Transaksi

- Pencarian berdasarkan keterangan/kategori dan pengurutan terbaru/terlama tetap tersedia.
- Kelompokkan transaksi berdasarkan tanggal; tampilkan ikon kategori, keterangan, kategori, dan nominal dengan hierarki yang jelas.
- Detail dibuka dengan mengetuk baris. Dari detail, **Edit** mengganti isi panel yang sama menjadi form; jangan membuka overlay kedua.
- Edit menggunakan tombol **Simpan perubahan** yang eksplisit. Pembatalan tidak menyimpan perubahan sebagian.
- Aksi hapus meminta konfirmasi yang menyebut transaksi. Jangan menghapus lewat swipe tanpa konfirmasi.
- Respons pencarian lama tidak boleh menimpa hasil query terbaru. Pagination mempertahankan urutan dan menghindari duplikasi.

### Grafik

- Pemilih siklus dengan tombol sebelumnya/berikutnya dan rentang tanggal yang jelas.
- Ringkasan anggaran serta rincian pengeluaran per kategori mengikuti siklus terpilih.
- Tampilkan batang horizontal kategori dengan nilai dan persentase agar mudah dibandingkan pada layar kecil.
- Grafik tren tetap menampilkan tujuh hari terakhir, dengan judul eksplisit **7 hari terakhir**; jangan memberi kesan grafik ini mengikuti pemilih siklus.
- Gunakan kategori dari database sebagai sumber label. Perbedaan pengeluaran yang masuk/dikecualikan dari anggaran mengikuti `include_in_budget`, bukan daftar nama kategori yang ditulis terpisah.
- Semua total yang ditampilkan memiliki label cakupan. Sediakan daftar angka yang terbaca tanpa hover.

### AI

- Header sederhana, daftar pesan yang dapat digulir, dan composer pada bagian bawah layout chat.
- Teks percakapan 16 px; saran pertanyaan berupa chip yang dapat disentuh dengan nyaman.
- Saat keyboard terbuka, sembunyikan saran yang tidak esensial untuk memberi ruang percakapan.
- Jangan memaksa scroll ke pesan terbaru ketika pengguna sedang membaca histori. Berikan aksi menuju pesan terbaru bila diperlukan.
- Tampilkan status pengiriman, kegagalan yang jelas, dan aksi coba lagi. Respons HTTP gagal tidak boleh menjadi bubble kosong.
- Pertahankan histori lokal yang sudah ada; konteks anggaran pada jawaban AI mengikuti rumus yang sama dengan Beranda.

### Pengaturan dan login

- Urutan Pengaturan: anggaran dan tanggal gajian, preferensi pengingat, penggunaan AI, lalu aksi akun/data.
- Pisahkan reset data dari aksi rutin; pertahankan konfirmasi password.
- Validasi hari gajian 1–31 dan anggaran rupiah nonnegatif; berikan feedback penyimpanan yang jelas.
- Izin notifikasi hanya diminta setelah aksi pengguna. Pengingat malam menggunakan pengeluaran aktual hari itu.
- Login memiliki label password, aksi tampil/sembunyikan, pesan gagal yang jelas, dan tombol yang tetap dapat dijangkau saat keyboard muncul.

## 7. Alur Catat

Panel memiliki tiga pilihan: **Ketik AI**, **Manual**, dan **Scan**. Ketik AI aktif ketika panel baru dibuka. Pergantian metode mempertahankan draft selama panel masih terbuka. Penutupan dengan perubahan yang belum disimpan meminta konfirmasi buang draft.

### Ketik AI

1. Pengguna mengetik, misalnya `kopi 20k` atau `gaji 10jt`.
2. Aksi **Proses** menampilkan status pemrosesan dan mencegah pengiriman berulang.
3. Hasil muncul dalam form yang dapat dikoreksi: jenis, nominal, kategori, tanggal, keterangan, serta catatan.
4. Pengguna menekan **Simpan transaksi**. Panel hanya ditutup setelah penyimpanan berhasil.

Jika AI gagal, pertahankan teks dan sediakan **Isi manual**. Jangan menyatakan transaksi tersimpan sebelum API mengonfirmasi.

### Manual

Urutan field: jenis Pengeluaran/Pemasukan, nominal, kategori, tanggal, keterangan, catatan opsional, lalu pilihan anggaran untuk pengeluaran.

- Default: Pengeluaran, tanggal hari ini di Jakarta, masuk anggaran aktif.
- Nominal memakai keyboard numerik dan pemformatan rupiah yang tidak menggeser caret secara tak terduga.
- Kategori difilter berdasarkan jenis; perubahan jenis mengharuskan kategori tetap sesuai.
- Gaji dicatat sebagai Pemasukan. Tidak ada penjadwalan atau pencatatan otomatis baru.
- Field invalid menampilkan pesan dekat field dan fokus diarahkan ke kesalahan pertama setelah submit.

### Scan

- Pengguna memilih gambar, menunggu pemrosesan, lalu meninjau tanggal, item, kategori, nominal, dan total.
- Item dapat dikoreksi atau dihapus. Simpan semua dinonaktifkan jika tidak ada item valid.
- Pertahankan perilaku pengelompokan berdasarkan kategori pada penyimpanan yang sudah ada; jelaskan jumlah transaksi yang akan disimpan pada konfirmasi.
- Field item terakhir dan aksi **Simpan semua** harus dapat dijangkau ketika keyboard terbuka.

## 8. Kontrak keyboard dan panel

Gunakan satu komponen panel form berbasis primitive dialog yang tersedia. Pada mobile, panel mengisi viewport terlihat; desktop memakai dialog terpusat. Hindari dua sistem yang sekaligus memindahkan panel ketika keyboard muncul.

- Struktur panel: header tetap dalam flex layout, body `min-height: 0` dengan `overflow-y: auto`, dan footer aksi yang tidak ikut tergulir.
- Satu pengelola viewport membaca `window.visualViewport.height` dan `offsetTop`, memperbarui ukuran/posisi melalui event `resize` dan `scroll`, serta membersihkan listener saat tidak diperlukan.
- Gunakan `100dvh` sebagai fallback. Jangan menganggap `dvh` saja menyelesaikan keyboard Safari.
- Bedakan keyboard dari pinch-zoom menggunakan konteks field editable yang fokus, perubahan ukuran viewport, dan `visualViewport.scale`. Fokus saja tidak cukup karena keyboard eksternal mungkin digunakan.
- Ukur apakah field aktif tertutup; gulirkan hanya area form yang diperlukan setelah viewport berubah. Hindari `scrollIntoView({ behavior: "smooth" })` pada setiap perpindahan fokus.
- Footer aksi berada di dalam area viewport terlihat, tanpa menambahkan kompensasi keyboard dua kali.
- Ketika ruang vertikal sangat pendek, ringkas header dan spasi; body tetap dapat digulir dan field aktif tidak boleh terjepit.
- Saat panel ditutup, lepaskan scroll lock dan pulihkan posisi halaman. Jangan menyisakan offset atau tinggi dari kondisi keyboard sebelumnya.

## 9. Makna angka dan kontrak data

### Rumus yang menjadi acuan

| Metrik | Definisi |
| --- | --- |
| Saldo keseluruhan | Seluruh pemasukan dikurangi seluruh pengeluaran |
| Pemasukan siklus | Semua transaksi pemasukan dalam rentang siklus |
| Pengeluaran siklus | Semua transaksi pengeluaran dalam rentang siklus |
| Terpakai dari anggaran | Pengeluaran dalam siklus dengan `include_in_budget=1` |
| Sisa anggaran | `monthly_budget` dikurangi terpakai dari anggaran |
| Pengeluaran hari ini | Seluruh pengeluaran pada tanggal Jakarta hari ini |

Pemasukan tidak memengaruhi sisa anggaran, termasuk pemasukan lama yang memiliki `include_in_budget=1`. Data lama tidak perlu diubah. Perubahan rumus berlaku juga untuk histori; tampilkan penjelasan singkat bahwa pemasukan tidak lagi menambah anggaran.

Contoh: anggaran Rp3.000.000, gaji Rp10.000.000, dan pengeluaran terikut Rp500.000 menghasilkan sisa anggaran **Rp2.500.000**. Tambahan pengeluaran Rp200.000 yang dikecualikan mengubah pengeluaran aktual menjadi Rp700.000, tetapi sisa anggaran tetap Rp2.500.000.

Siklus dimulai pada tanggal gajian secara inklusif dan berakhir sebelum tanggal gajian berikutnya. Untuk hari 29–31 pada bulan pendek, gunakan hari terakhir bulan tersebut. Seluruh perhitungan memakai kalender Jakarta dan helper bersama, bukan timezone host.

Sisa negatif tetap ditampilkan sebagai nominal kelebihan belanja. Progres visual dibatasi 0–100% tanpa mengubah nilai asli. Siklus historis menggunakan label **Sisa akhir**, tanpa rekomendasi harian atau countdown negatif.

### Perubahan antarmuka yang direncanakan

- Tambahkan `POST /api/transactions/manual`, menerima nominal, jenis, `category_id`, tanggal, keterangan, catatan opsional, serta `include_in_budget`; mengembalikan transaksi tersimpan dengan status 201.
- Endpoint manual tidak memanggil AI. Isi `raw_input` dari keterangan manual untuk kompatibilitas tabel dan simpan `ai_confirmed=0`.
- Validasi server: nominal bilangan bulat positif dalam rentang integer aman, jenis valid, kategori sesuai jenis, tanggal kalender valid, dan flag anggaran valid. Untuk pemasukan baru, simpan flag anggaran sebagai 0.
- Pertahankan endpoint AI/scan yang ada. Gunakan validasi dan tipe transaksi bersama pada alur yang disentuh.
- Perluas respons statistik secara aditif untuk ringkasan siklus di Beranda. Samakan agregasi Beranda, Grafik, dan konteks AI.
- Refresh ringkasan dan daftar terkait setelah simpan, edit, hapus, atau perubahan pengaturan anggaran.
- Semua perubahan memakai schema yang ada, query terparameterisasi, dan autentikasi cookie HTTP-only yang dipertahankan.

## 10. Status UI dan kegagalan

| Kondisi | Perilaku |
| --- | --- |
| Memuat | Skeleton mengikuti bentuk konten, tanpa layout bergeser besar |
| Belum ada transaksi | Penjelasan singkat dan aksi Catat transaksi pertama |
| Pencarian kosong | Tampilkan query/konteks dan aksi menghapus pencarian |
| API ringkasan gagal | Pesan gagal dan Coba lagi; jangan mengganti data dengan angka nol seolah valid |
| Menyimpan | Tombol menunjukkan proses dan tidak bisa dikirim berulang |
| Simpan gagal | Draft tetap utuh, kesalahan terlihat, pengguna dapat mencoba lagi |
| Berhasil | Feedback singkat, data diperbarui, fokus kembali ke konteks sebelumnya |
| Anggaran belum diatur | Aksi menuju pengaturan; tanpa status aman/terlampaui |
| Anggaran terlampaui | Teks eksplisit, nominal selisih, serta indikator warna pendukung |

## 11. Kriteria penerimaan

### Safari dan layout

- Uji pada iPhone fisik: login, input AI, form manual, edit transaksi, item scan terbawah, pencarian, chat panjang, dan pengaturan dengan keyboard terbuka.
- Uji buka/tutup keyboard berulang, rotasi, toolbar Safari muncul/hilang, safe area, pinch-zoom, serta pemulihan scroll setelah dialog ditutup.
- Field aktif terlihat, tombol aksi dapat dijangkau, dan tidak ada scroll horizontal atau ruang kosong bekas keyboard.
- Periksa lebar 320, 375, 390, 430, 768, dan 1280 px, nominal panjang, serta pembesaran teks.
- Lakukan pemeriksaan tambahan pada Chrome Android. Emulasi desktop tidak dianggap bukti bahwa bug keyboard iPhone selesai.
- Periksa kontras, navigasi keyboard, label screen reader, focus ring, dan reduced motion.

### Data dan alur

- Uji pengeluaran/pemasukan manual, AI gagal lalu beralih ke manual, koreksi hasil AI, scan multiitem, edit, hapus, dan kegagalan penyimpanan.
- Uji formula contoh di atas, pengeluaran yang dikecualikan, anggaran nol, sisa negatif, pergantian tahun, Februari, tahun kabisat, dan tanggal gaji 31.
- Dashboard, Grafik, dan jawaban AI menggunakan sisa anggaran yang sama untuk periode yang sama.
- Pencarian cepat dan perpindahan siklus tidak menampilkan respons request lama sebagai data terbaru.
- Tambahkan pengujian otomatis terarah untuk helper siklus, agregasi anggaran, dan validasi endpoint manual. Hindari snapshot yang hanya menyalin implementasi visual.
- Jalankan lint dan production build setelah implementasi. Perbaiki masalah pada kode yang diubah dan laporkan sisa masalah baseline secara terpisah.
- Gunakan data uji disposable untuk operasi tulis. Jangan menjalankan `scripts/migrate-db.mjs` terhadap database pengguna karena skrip menghapus tabel.
- Sertakan screenshot Beranda, Catat, Transaksi, Grafik, dan kondisi keyboard untuk review hasil implementasi.

## 12. Urutan implementasi dan referensi

Urutan kerja: token visual dan app shell → panel/keyboard → helper anggaran dan kontrak data → input transaksi → seluruh halaman → verifikasi Safari dan regresi.

Dokumen ini adalah sumber acuan desain revamp. README telah diselaraskan dengan implementasi charcoal + sage. Status pengujian dan checklist perangkat dicatat terpisah dalam VERIFY.md.

Referensi yang ditinjau saat perencanaan:

- [Copilot Money — Dashboard overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview): referensi hierarki ringkasan dan akses menuju rincian keuangan.
- [Lunch Money — Features](https://lunchmoney.app/features): referensi pengorganisasian transaksi dan pemisahan kemampuan pencatatan/analisis. Tidak semua fiturnya termasuk scope Dompeto.
- [MDN — VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport): ukuran area terlihat, offset, dan event viewport.
- [Chrome — Viewport resize behavior](https://developer.chrome.com/blog/viewport-resize-behavior): perbedaan layout viewport dan visual viewport ketika keyboard muncul. Pengaturan khusus Chrome tidak dijadikan solusi tunggal untuk Safari.

Referensi dipakai untuk pola interaksi dan dasar teknis; warna, komposisi, serta copy mengikuti spesifikasi Dompeto di dokumen ini.
