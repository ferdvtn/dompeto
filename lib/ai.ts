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
  "description": <string singkat, max 50 karakter>,
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
- "description": JANGAN biarkan kosong. Jika kata tidak bermakna (misal: "asdasd"), gunakan potongan input asli sebagai deskripsi.
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
Kamu adalah OCR & Financial Parser cerdas. Tugasmu mengekstrak item belanja dari gambar struk.
Kembalikan data dalam format JSON murni.

ATURAN DISKON & VOUCHER:
- Jika ada baris "VOUCHER", "DISKON", "DISC", "POTONGAN" setelah sebuah item, nilai tersebut adalah diskon untuk item di atasnya.
- originalAmount = harga asli item (sebelum diskon)
- discount = total voucher/diskon untuk item tersebut (integer positif, bukan negatif)
- amount = originalAmount - discount (harga final yang benar-benar dibayar)
- Jika tidak ada diskon: discount = 0, amount = originalAmount
- JANGAN gunakan originalAmount sebagai amount final jika ada voucher.
- SELALU gunakan nilai "TOTAL BELANJA" atau "TOTAL" dari struk sebagai validasi.
- Jika SUM(items.amount) berbeda lebih dari 5% dari total struk, periksa ulang voucher yang mungkin terlewat.

PANDUAN KATEGORI:
- "Makan & Minuman": makanan siap makan, minuman, snack, susu, roti, beras, bumbu masak, mie instan, gula, tepung, kopi, teh, makanan bayi
- "Belanja": produk rumah tangga NON-makanan seperti deterjen, sabun mandi, sampo, minyak goreng, pembersih lantai, tisu, popok, pembalut, pasta gigi, peralatan dapur, produk kecantikan, body wash
- "Kesehatan": obat-obatan, vitamin, suplemen, masker kesehatan, alat kesehatan
- "Transport": bensin, parkir, tol, ojek, tiket kendaraan
- "Tagihan & Utilitas": listrik, air, internet, pulsa, token listrik
- "Pendidikan": buku, alat tulis, kursus, perlengkapan sekolah
- "Hiburan": game, streaming, bioskop, mainan
- "Lainnya": tidak masuk kategori manapun di atas

PENTING — JANGAN SALAH KATEGORI:
- Minyak goreng → "Belanja" BUKAN "Makan & Minuman"
- Deterjen, sabun, sampo, body wash → "Belanja"
- Susu UHT, susu formula → "Makan & Minuman"
- Struk supermarket sering campur item makanan dan non-makanan, kategorikan per item secara teliti.

ATURAN UMUM:
- Abaikan baris pajak (PPN), subtotal, NON TUNAI, ANDA HEMAT, HARGA JUAL — hanya ekstrak item produk.
- Jika harga tidak terbaca → amount: 0.
- description max 60 karakter, gunakan nama yang mudah dimengerti (bukan kode singkat).

FORMAT OUTPUT (JSON):
{
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "<Nama-nama Barang di kategori tersebut, pisahkan dengan koma>", "amount": 15000, "category": "Makan & Minuman" },
    ...
  ]
}
`.trim()

	try {
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: "user",
					content: [
						{ type: "text", text: systemInstruction },
						{
							type: "image_url",
							image_url: { url: `data:image/jpeg;base64,${base64Image}` },
						},
					],
				},
			],
			model: "meta-llama/llama-4-scout-17b-16e-instruct",
			response_format: { type: "json_object" },
			temperature: 0,
		})

		const responseText = chatCompletion.choices[0]?.message?.content || "{}"
		console.log("Groq Vision Raw Response:", responseText)
		return JSON.parse(responseText)
	} catch (error) {
		console.error("Groq Vision Error:", error)
		throw new Error("Gagal menganalisis struk")
	}
}
