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
	intent: "period" | "largest" | "all" | "unclear"
}

/**
 * Mendeteksi niat (intent) pengguna untuk menentukan periode data secara dinamis.
 */
export async function detectIntent(message: string): Promise<IntentResult> {
	const systemInstruction = `
Tugas: Analisis maksud periode waktu dari pesan pengguna dan kembalikan JSON.

EKSTRAKSI:
- "intent": "period" (untuk rentang waktu), "largest" (untuk transaksi terbesar), "all" (semua data), "unclear" (jika pesan bukan pertanyaan tentang laporan/data).
- "days": jumlah total hari dalam angka.
- "label": nama periode yang ramah.

ATURAN PERHITUNGAN HARI:
- "hari ini": 0 hari
- "minggu ini/sepekan": 7 hari
- "bulan ini": 30 hari
- Kalkulasikan total hari jika ada angka (misal: "3 hari", "2 minggu").

IDENTIFIKASI "UNCLEAR":
- Jika pengguna hanya menyapa (halo, hi), bicara di luar konteks keuangan, atau perintah tidak jelas, gunakan intent: "unclear".

FORMAT OUTPUT (JSON):
{
  "intent": "period" | "largest" | "all" | "unclear",
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
Kamu adalah asisten keuangan personal Dompeto yang ceria dan informatif.
Jawablah dalam Bahasa Indonesia yang santai tapi profesional.
Gunakan data di bawah sebagai satu-satunya rujukan angka.

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
