import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateReport, detectIntent } from "@/lib/ai"
import { getJakartaISODate } from "@/lib/date-utils"

/**
 * Handle POST request for AI Chat Assistant.
 * Uses Intent Detection and updates daily stats.
 */
export async function POST(req: NextRequest) {
	try {
		const { message } = await req.json()
		const today = getJakartaISODate()

		// 1. Update Daily Stats (Chat Used)
		try {
			await db.execute({
				sql: `INSERT INTO daily_stats (date, chat_used) VALUES (?, 1) 
                      ON CONFLICT(date) DO UPDATE SET chat_used = chat_used + 1`,
				args: [today],
			})
		} catch (e) {
			console.error("Failed to update daily stats:", e)
		}

		// 2. Detect Intent using AI
		const intentData = await detectIntent(message)

		let sql = ""
		let periodName = intentData.label

		// 3. Select SQL based on Intent
		if (intentData.intent === "unclear") {
			sql = "" // No data needed
		} else if (intentData.intent === "largest") {
			sql = `
        SELECT t.description, t.amount, c.name as category 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.amount DESC LIMIT 5
      `
		} else if (intentData.label.toLowerCase().includes("bulan lalu")) {
			// Special handling for calendar last month
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE strftime('%Y-%m', t.created_at) = strftime('%Y-%m', 'now', '+7 hours', '-1 month')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		} else {
			// Dynamic period based on days
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.created_at >= datetime('now', '+7 hours', '-${intentData.days} days')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		}

		const result = sql ? await db.execute(sql) : { rows: [] }

		// 4. Format Summary
		let dbSummary = ""
		if (intentData.intent === "unclear") {
			dbSummary = `Pesan pengguna kurang spesifik mengenai data keuangan. 
Berikan salam dan beritahu pengguna bahwa Anda bisa membantu menyajikan laporan keuangan.
CONTOH PERTANYAAN YANG BISA DIAJUKAN:
- "Habis berapa ya hari ini?"
- "Rekap pengeluaran 7 hari terakhir"
- "Apa saja transaksi terbesar saya?"
- "Berapa total pemasukan bulan ini?"
- "Review pengeluaran 2 minggu ke belakang"`
		} else {
			dbSummary = `=== DATA KEUANGAN ===\nPeriode: ${periodName}\n\n`
			if (result.rows.length === 0) {
				dbSummary += "Tidak ditemukan data transaksi untuk periode ini."
			} else {
				let totalExpense = 0
				let totalIncome = 0
				let breakdown = "Breakdown per kategori:\n"
				result.rows.forEach((row: any) => {
					if (row.type === "expense") {
						totalExpense += Number(row.total || 0)
						breakdown += `- ${row.category || "Lainnya"}: Rp ${Number(row.total).toLocaleString("id-ID")} (${row.count}x)\n`
					} else if (row.type === "income") {
						totalIncome += Number(row.total || 0)
						breakdown += `- ${row.category || "Pemasukan"}: Rp ${Number(row.total).toLocaleString("id-ID")} (${row.count}x)\n`
					} else {
						breakdown += `- ${row.category || "Lainnya"}: Rp ${Number(row.amount).toLocaleString("id-ID")} (${row.description || "Tanpa deskripsi"})\n`
					}
				})
				if (intentData.intent === "largest") {
					dbSummary += breakdown
				} else {
					dbSummary += `Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}\n`
					dbSummary += `Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}\n\n`
					dbSummary += breakdown
				}
			}
		}

		// 5. Generate AI Response
		const reply = await generateReport(message, dbSummary)

		return NextResponse.json({ reply })
	} catch (error) {
		console.error("Chat API Error:", error)
		return NextResponse.json(
			{ error: "Gagal memproses permintaan chat." },
			{ status: 500 },
		)
	}
}
