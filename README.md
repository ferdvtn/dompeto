# Dompeto (MVP)

Aplikasi pelacak keuangan pribadi berbasis AI yang ringan, aman, dan tanpa biaya operasional.

## Fitur Utama

- **AI-Powered Input**: Catat transaksi dengan bahasa alami (misal: "bakso 10k", "gajian 5jt").
- **Chat Laporan**: Tanya kondisi keuanganmu ke asisten AI Gemini.
- **Mobile Friendly**: Desain responsif, nyaman digunakan di HP maupun Desktop.
- **Zero Cost**: Menggunakan Turso (SQLite Cloud) dan Google Gemini tingkat gratis.

## Teknologi

- Framework: Next.js (App Router)
- Database: Turso (LibSQL)
- AI: Groq Cloud (Llama 3)
- Auth: JWT di HTTP-only cookie (jose)
- Styling: Tailwind CSS

## Persiapan

1. Masukkan variabel lingkungan di `.env.local`:

   ```bash
   APP_PASSWORD=        # Password untuk login
   APP_JWT_SECRET=      # String acak min 32 karakter
   TURSO_DATABASE_URL=  # URL dari Turso Dashboard
   TURSO_AUTH_TOKEN=    # Token dari Turso Dashboard
   GEMINI_API_KEY=      # (Opsional) API Key Gemini
   GROQ_API_KEY=        # API Key dari console.groq.com
   ```

2. Jalankan SQL Schema di Turso:

   ```sql
   CREATE TABLE IF NOT EXISTS transactions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     raw_input TEXT NOT NULL,
     amount INTEGER NOT NULL,
     type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
     category TEXT NOT NULL,
     description TEXT,
     notes TEXT,
     created_at DATETIME DEFAULT (datetime('now', 'localtime'))
   );

   CREATE TABLE IF NOT EXISTS login_attempts (
     ip TEXT PRIMARY KEY,
     count INTEGER DEFAULT 1,
     last_attempt DATETIME DEFAULT (datetime('now', 'localtime'))
   );
   ```

## Pengembangan Lokal

```bash
npm install
npm run dev
```

## Deployment

Push ke GitHub dan hubungkan ke Vercel. Jangan lupa tambahkan Environment Variables di dashboard Vercel.
