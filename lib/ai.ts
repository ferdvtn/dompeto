import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" })

export interface TransactionParseResult {
	amount: number
	type: "expense" | "income"
	category: string
	description: string
	notes: string
}

/**
 * Mengekstrak informasi transaksi menggunakan Groq (Llama 3).
 */
export async function parseTransaction(
	rawInput: string,
): Promise<TransactionParseResult | null> {
	const systemInstruction = `
Kamu adalah parser transaksi keuangan cerdas untuk pengguna Indonesia.
Tugasmu mengekstrak informasi dari teks bebas dan mengembalikan JSON.

FORMAT OUTPUT (hanya JSON):
{
  "amount": <integer dalam Rupiah>,
  "type": <"expense" atau "income">,
  "category": <salah satu dari kategori di bawah>,
  "description": <string singkat, GUNAKAN Capital Case untuk kata penting, tapi "dan", "di", "ke" harus huruf kecil. Akronim seperti "UHT", "PLN", "PDAM", "Rp", "IDR" harus HURUF KAPITAL SEMUA. (Contoh: "Kopi dan Susu UHT", "Tagihan PLN", "Gaji dan Bonus")>,
  "notes": <konteks tambahan jika ada, boleh kosong>
}

KATEGORI YANG TERSEDIA & CONTOH KEYWORD:
- Makan & Minuman: kopi, boba, warteg, nasi goreng, gofood, grabfood, jajan, pasar
- Transport: bensin, gojek, grab, pertalite, parkir, tol, tiket
- Belanja: alfamart, indomaret, shopee, tokopedia, baju, skin care
- Hiburan: bioskop, netflix, game, spotify, staycation
- Kesehatan: apotek, dokter, rumah sakit, obat, vitamin
- Tagihan: listrik, pdam, wifi, pulsa, rumah, kontrakan, cicilan, kost
- Pendidikan: buku, kursus, spp, kuliah
- Invest: saham, reksadana, crypto
- Pemasukan: gajian, bonus, cashback, terima transfer, kiriman, jual barang
- Lainnya: jika benar-benar tidak cocok dengan kategori di atas

ATURAN PARSING:
- "rumah" -> jika nominal besar, masukkan ke Tagihan (kontrakan/cicilan).
- "kopi" -> Makan & Minuman.
- "10k", "10rb" = 10000.
- "1jt" = 1000000.
- "description": JANGAN biarkan kosong. GUNAKAN aturan penulisan Indonesia: Huruf Kapital di awal kata, KECUALI kata hubung "dan", "di", "ke" (kecuali di awal kalimat). Akronim (UHT, PLN, PDAM, Rp, IDR) harus HURUF KAPITAL SEMUA. Jika kata tidak bermakna (misal: "asdasd"), gunakan potongan input asli sebagai deskripsi.
- Pastikan angka murni tanpa titik/koma.
`.trim()

	try {
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: rawInput },
			],
			model: "llama-3.3-70b-versatile",
			response_format: { type: "json_object" },
		})

		const responseText = chatCompletion.choices[0]?.message?.content || ""
		const data = JSON.parse(responseText)

		if (data.amount === undefined || !data.type || !data.category) {
			console.error("Groq returned invalid fields:", data)
			return null
		}

		return {
			amount: Number(data.amount),
			type: data.type,
			category: data.category,
			description: data.description || "",
			notes: data.notes || "",
		}
	} catch (error) {
		console.error("Groq Parse Error:", error)
		return null
	}
}

export interface IntentResult {
	label: string
	days: number
	intent: "period" | "largest" | "all" | "write" | "unclear"
}

/**
 * Mendeteksi niat (intent) pengguna untuk menentukan periode data secara dinamis.
 */
export async function detectIntent(message: string): Promise<IntentResult> {
	const systemInstruction = `
Tugas: Analisis maksud periode waktu dari pesan pengguna dan kembalikan JSON.

EKSTRAKSI:
- "intent": 
  * "period": Untuk pertanyaan rekap, analisa, atau info budget (misal: "rekap hari ini", "persentase makan", "sisa budget", "saldo").
  * "largest": Untuk mencari transaksi paling besar (misal: "top pengeluaran", "paling mahal").
  * "all": Untuk melihat semua data tanpa filter waktu tertentu.
  * "write": Untuk perintah manipulasi data (catat, hapus, edit).
  * "unclear": Hanya jika pesan benar-benar tidak ada hubungannya dengan keuangan (misal: "halo", "cuaca hari ini").
- "days": Jumlah TOTAL hari dalam angka (Default: 30).
- "label": Nama periode yang ramah (misal: "Hari ini", "7 hari terakhir").

CONTOH:
- "Analisa persentase makan" -> intent: "period", days: 30, label: "Bulan ini"
- "Sisa budget gaji saya?" -> intent: "period", days: 30, label: "Bulan ini"
- "Transaksi terbesar minggu ini" -> intent: "largest", days: 7, label: "Minggu ini"
- "Habis berapa kemarin?" -> intent: "period", days: 1, label: "Kemarin"

FORMAT OUTPUT (JSON):
{
  "intent": "period" | "largest" | "all" | "write" | "unclear",
  "days": <number>,
  "label": "<string>"
}
`.trim()

	try {
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: message },
			],
			model: "llama-3.1-8b-instant",
			response_format: { type: "json_object" },
			temperature: 0,
		})

		const data = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}")

		return {
			label: data.label || "Bulan ini",
			days: Number(data.days) || 30,
			intent: data.intent || "period",
		}
	} catch (error) {
		return { label: "Bulan ini", days: 30, intent: "period" }
	}
}

/**
 * Menghasilkan laporan naratif menggunakan Groq.
 */
export async function generateReport(
	userMessage: string,
	dbSummary: string,
): Promise<string> {
	const systemInstruction = `
Kamu adalah analis keuangan Dompeto yang sangat efisien dan TO-THE-POINT.
ATURAN UTAMA:
1. JANGAN HALUSINASI. Jika data tidak ada atau pesan user tidak jelas, jawab jujur bahwa Anda tidak bisa memprosesnya.
2. JANGAN gunakan salam pembuka/penutup.
3. JANGAN menyebutkan nama metadata seperti "[KONTEKS_ANGGARAN]" atau "[REKAP_TRANSAKSI]".
4. Jika instruksi menyebutkan [UNCLEAR], berikan respon: "Maaf, pertanyaan kurang jelas. Silakan tanya spesifik seperti 'Rekap hari ini' atau 'Sisa budget'."
5. Jika instruksi menyebutkan [INSTRUKSI] Tolak CRUD: "Maaf, saya asisten baca-saja. Gunakan tombol CATAT untuk menambah data."

PANDUAN DATA:
- Gunakan [KONTEKS_ANGGARAN] untuk sisa kuota gaji/budget.
- Gunakan [REKAP_TRANSAKSI] untuk total dan analisis pengeluaran.
- Gabungkan info keduanya secara natural guna menjawab user (misal: "Makan Anda 25% dari total, dan sisa budget gaji Rp 5jt").

DATA KEUANGAN:
${dbSummary}
`.trim()

	try {
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: userMessage },
			],
			model: "llama-3.3-70b-versatile",
		})

		return (
			chatCompletion.choices[0]?.message?.content ||
			"Maaf, gagal menyusun laporan."
		)
	} catch (error) {
		console.error("Groq Report Error:", error)
		return "Maaf, terjadi gangguan pada sistem laporan."
	}
}

/**
 * Menganalisis gambar struk menggunakan Groq Vision (Llama 3.2 Vision).
 * Mengembalikan daftar item transaksi yang ditemukan.
 */
export async function scanReceipt(base64Image: string) {
	const systemInstruction = `
Kamu adalah OCR struk belanja untuk aplikasi keuangan Indonesia.
Ekstrak SETIAP item sebagai baris terpisah dan kembalikan JSON murni.

ATURAN DISKON & VOUCHER:
- Baris "VOUCHER", "DISKON", "DISC", "POTONGAN" setelah item = diskon item di atasnya
- originalAmount = harga asli sebelum diskon
- discount = nilai diskon (integer positif)
- amount = originalAmount - discount
- Jika tidak ada diskon: discount = 0, amount = originalAmount
- VALIDASI: SUM(items.amount) harus mendekati TOTAL BELANJA di struk (toleransi 5%)

PANDUAN KATEGORI (gunakan nama PERSIS seperti ini):
- "Makan & Minuman": makanan, minuman, snack, susu, roti, beras, bumbu, mie, gula, kopi, teh
- "Belanja": minyak goreng, deterjen, sabun, sampo, body wash, tisu, popok, pasta gigi, produk kecantikan
- "Kesehatan": obat, vitamin, suplemen, alat kesehatan
- "Transport": bensin, parkir, tol
- "Tagihan": listrik, air, internet, pulsa
- "Pendidikan": buku, alat tulis
- "Hiburan": game, streaming, mainan
- "Invest": reksa dana, saham, obligasi, emas
- "Lainnya": tidak masuk kategori manapun

PENTING:
- Minyak goreng → "Belanja" BUKAN "Makan & Minuman"
- Sabun, sampo, body wash → "Belanja"
- Susu UHT, susu formula → "Makan & Minuman"
- Struk supermarket sering campur item makanan dan non-makanan, kategorikan per item secara teliti.

ATURAN UMUM:
- Jika harga tidak terbaca → amount: 0.
- description max 40 karakter. Gunakan ringkasan jenis barang dengan aturan penulisan Indonesia: Huruf Kapital di awal kata, KECUALI "dan", "di", "ke". Akronim (UHT, PLN, PDAM, Rp, IDR) harus HURUF KAPITAL SEMUA (Contoh: "Susu UHT", "Gula dan Kopi", "Token PLN").

FORMAT OUTPUT (JSON):
{
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "<Ringkasan Jenis Barang: Susu UHT, Kaldu Ayam, Mie Instan>", "amount": 15000, "category": "Makan & Minuman" },
    ...
  ]
}
`.trim()

	try {
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: "system",
					content: systemInstruction,
				},
				{
					role: "user",
					content: [
						{
							type: "text",
							text:
								"Ekstrak dan kelompokkan semua item dari struk ini berdasarkan kategori. Pastikan perhitungan voucher/diskon sudah dikurangi dari setiap item.",
						},
						{
							type: "image_url",
							image_url: {
								url: `data:image/jpeg;base64,${base64Image}`,
							},
						},
					],
				},
			],
			model: "meta-llama/llama-4-scout-17b-16e-instruct",
			response_format: { type: "json_object" },
			temperature: 0,
		})

		const responseText = chatCompletion.choices[0]?.message?.content ?? "{}"

		const parsed = JSON.parse(responseText)

		// Validasi struktur dasar
		if (!parsed.items || !Array.isArray(parsed.items)) {
			throw new Error("Format response tidak valid: items tidak ditemukan")
		}

		// Normalisasi: pastikan semua field ada dan amount adalah integer
		parsed.items = parsed.items.map(
			(item: { name?: string; amount?: number; category?: string }) => ({
				name: item.name ?? "Item tidak diketahui",
				amount: Math.round(item.amount ?? 0),
				category: item.category ?? "Lainnya",
			}),
		)

		return parsed
	} catch (error) {
		throw new Error("Gagal menganalisis struk")
	}
}
