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

ATURAN EKSTRAKSI:
1. Hanya ambil item belanja riil (barang/jasa yang dibeli).
2. ABAIKAN/BUANG item berikut: 
   - DISKON, PROMO, VOUCHER, POTONGAN HARGA (pindahkan nilainya untuk mengurangi harga item terkait jika perlu, tapi JANGAN masukkan sebagai item terpisah).
   - "ANDA HEMAT", "SAVINGS", "TOTAL DISKON".
   - Item dengan harga 0 atau negatif.
   - Pajak (PPN/Tax) dan Service Charge (masukkan ke item 'Lainnya' jika ada, atau abaikan jika kecil).
3. Untuk setiap item, tentukan kategori yang paling cocok:
   - Makan & Minuman, Transport, Belanja, Hiburan, Kesehatan, Tagihan, Pendidikan, Invest, Lainnya.
4. Estimasi tanggal struk (format YYYY-MM-DD). Jika tidak ada, gunakan null.

FORMAT OUTPUT (JSON):
{
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "Nama Barang", "amount": 15000, "category": "Makan & Minuman" },
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
