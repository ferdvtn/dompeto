# Dompeto

Aplikasi pencatat pengeluaran dan pemasukan dengan tema **charcoal + sage**, mengutamakan mobile web dan keterbacaan di ruangan redup. Spesifikasi tampilan dan perilaku ada di [DESIGN.md](DESIGN.md).

## Fitur

- Beranda menampilkan sisa anggaran dalam siklus gaji, pemasukan, pengeluaran, dan transaksi terbaru.
- Pencatatan melalui Ketik AI, Manual, atau Scan struk; hasil AI diperiksa sebelum disimpan.
- Edit dengan tombol simpan eksplisit, pencarian transaksi, serta grafik kategori dan tujuh hari terakhir.
- Chat AI dengan histori lokal maksimal 50 pesan dan aksi coba lagi saat gagal.
- Panel form dan chat mengikuti VisualViewport; navigasi disembunyikan saat keyboard terdeteksi.
- Navigasi bawah pada mobile dan sidebar mulai lebar 768 px.
- Pengingat malam opsional per perangkat, aktif saat aplikasi terbuka. Izin notifikasi browser diminta melalui tombol.
- Reset seluruh data tetap membutuhkan password.

Anggaran adalah batas belanja tetap: **sisa = anggaran − pengeluaran yang masuk anggaran**. Pemasukan menambah saldo, bukan batas belanja. Rumus ini berlaku pada histori tanpa mengubah transaksi lama. Tanggal gaji 29–31 memakai hari terakhir pada bulan pendek. Semua tanggal bisnis menggunakan kalender Jakarta.

## Teknologi

Next.js App Router, React, TypeScript, Tailwind CSS v4, Base UI Dialog, Lucide, Turso SQLite, Groq, dan autentikasi JWT melalui cookie HTTP-only.

## Menjalankan

```sh
npm install
npm run dev
```

Isi `.env.local` dengan `APP_PASSWORD`, `APP_JWT_SECRET` (minimal 32 karakter), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, dan `GROQ_API_KEY`. Jangan commit kredensial atau data keuangan.

Aplikasi tersedia di `http://localhost:3000`.

**Revamp tidak memerlukan migrasi schema.** `scripts/migrate-db.mjs` menghapus tabel sebelum membuat ulang; gunakan hanya untuk database disposable yang memang boleh dihapus.

## Verifikasi

```sh
npm test
npm run lint
npm run build
```

Pengujian memakai Node test runner, TypeScript yang sudah tersedia, serta `python3` dengan SQLite bawaan. Database dibuat pada direktori sementara dan dihapus setelah pengujian; `.env.local` tidak dibaca. Cakupan: batas siklus gaji, rumus anggaran, validasi nominal/tanggal, endpoint manual/AI-confirm/scan/edit/hapus, serta konsistensi statistik.

Build menggunakan `next/font` dan membutuhkan akses Google Fonts untuk Geist. Hasil dan pemeriksaan perangkat yang masih perlu dilakukan dicatat dalam [VERIFY.md](VERIFY.md).
