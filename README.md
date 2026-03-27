# Dompeto v2.0 (Premium Revamp)

Dompeto adalah aplikasi pelacak keuangan pribadi berbasis AI yang dirancang dengan estetika **Midnight Slate**—gelap, tajam, dan modern. Menggunakan infrastruktur tanpa biaya (_zero cost_) namun memberikan pengalaman pengguna kelas premium.

![Dashboard Preview](https://via.placeholder.com/800x400/0f172a/3b82f6?text=Dompeto+v2.0+Midnight+Slate)

## ⚡ Fitur Utama

- **🧠 AI Assistant (Groq Llama 3)**: Catat transaksi hanya dengan mengetik kalimat bebas (misal: "makan siang bareng temen 50rb" atau "topup gopay 100k").
- **💬 Chat History & Persistence**: Riwayat chat AI tersimpan aman di browser (max 50 pesan) sehingga tidak hilang saat berpindah halaman.
- **📊 Analytics & Trends**: Visualisasi pengeluaran harian, alokasi kategori, dan pelacakan siklus gaji bulanan yang intuitif.
- **🛡️ Protected Reset**: Keamanan ekstra dengan konfirmasi password untuk menghapus seluruh data transaksi.
- **✨ Selective Skeleton Loading**: Transisi halaman yang mulus dan responsif dengan pemuatan data parsial berbasis _pulse animation_.
- **🌍 Timezone Awareness**: Sinkronisasi penuh dengan Waktu Indonesia Barat (WIB/Jakarta).

## 🛠️ Teknologi & Stack

- **Core**: Next.js 16 (App Router + Turbopack)
- **Database**: Turso (Edge SQLite)
- **AI Engine**: Groq Cloud (`llama-3.1-8b-instant`)
- **Auth**: JWT with HTTP-only Cookies (jose)
- **Styling**: Tailwind CSS & Lucide Icons
- **Components**: Radix UI & Selective Skeletons

## 🚀 Persiapan & Instalasi

### 1. Konfigurasi Environment

Buat file `.env.local` di root direktori dan isi variabel berikut:

```bash
APP_PASSWORD=        # Password untuk akses Dashboard
APP_JWT_SECRET=      # String acak minimal 32 karakter
TURSO_DATABASE_URL=  # URL dari Turso Dashboard
TURSO_AUTH_TOKEN=    # Token dari Turso Dashboard
GROQ_API_KEY=        # API Key dari console.groq.com
```

### 2. Inisialisasi Database

Jalankan skrip migrasi untuk membuat tabel dan data awal:

```bash
node scripts/migrate-db.mjs
```

### 3. Jalankan Aplikasi

```bash
npm install
npm run dev
```

Akses aplikasi di `http://localhost:3000`.

## 📜 Lisensi

Dikembangkan untuk penggunaan pribadi. Silakan fork dan sesuaikan dengan kebutuhan Anda.
