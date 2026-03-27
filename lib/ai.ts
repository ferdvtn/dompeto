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

/**
 * Mendeteksi niat (intent) pengguna untuk menentukan periode data.
 */
export async function detectIntent(message: string): Promise<string> {
	const systemInstruction = `
Tugas: Klasifikasikan maksud periode waktu dari pesan pengguna hanya ke dalam salah satu label di bawah.

LABEL & KATA KUNCI:
- today: hari ini, tadi, barusan, pengeluaran sekarang, hari ini habis berapa
- this_week: minggu ini, sepekan ini, 7 hari terakhir, seminggu, hari-hari ini
- last_month: bulan lalu, sebulan yang lalu, bulan kemarin
- largest: terbesar, paling mahal, paling banyak, boros di mana, top 5, belanja paling gede
- current_month: (default jika tidak ada di atas) bulan ini, laporan, ringkasan, rekap

ATURAN:
- Jika ada kata "hari ini", WAJIB pilih: today
- Jika ada kata "terbesar" atau "paling", WAJIB pilih: largest
- Kembalikan HANYA labelnya saja (lowercase).

Pesan Pengguna: "${message}"
Label:`.trim()

	try {
		const chatCompletion = await groq.chat.completions.create({
			messages: [{ role: "user", content: systemInstruction }],
			model: "llama-3.1-8b-instant",
			max_tokens: 10,
			temperature: 0,
		})

		const label =
			chatCompletion.choices[0]?.message?.content?.toLowerCase().trim() ||
			"current_month"

		if (label.includes("today")) return "today"
		if (label.includes("this_week")) return "this_week"
		if (label.includes("last_month")) return "last_month"
		if (label.includes("largest")) return "largest"
		return "current_month"
	} catch (error) {
		return "current_month"
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
