import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateReport, detectIntent } from "@/lib/ai"

/**
 * Handle POST request for AI Chat Assistant.
 * Uses Intent Detection and updates daily stats.
 */
export async function POST(req: NextRequest) {
	try {
		const { message } = await req.json()
		const today = new Date().toISOString().split("T")[0]

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
		const intent = await detectIntent(message)

		let sql = ""
		let periodName = ""

		// 3. Select SQL based on Intent
		if (intent === "this_week") {
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.created_at >= datetime('now', 'localtime', '-7 days')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
			periodName = "7 hari terakhir"
		} else if (intent === "today") {
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE date(t.created_at) = date(datetime('now', 'localtime'))
        GROUP BY t.type, c.name ORDER BY total DESC
      `
			periodName = "Hari ini"
		} else if (intent === "last_month") {
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE strftime('%Y-%m', t.created_at) = strftime('%Y-%m', datetime('now', 'localtime', '-1 month'))
        GROUP BY t.type, c.name ORDER BY total DESC
      `
			periodName = "Bulan lalu"
		} else if (intent === "largest") {
			sql = `
        SELECT t.description, t.amount, c.name as category 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.amount DESC LIMIT 5
      `
			periodName = "Transaksi terbesar"
		} else {
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE strftime('%Y-%m', t.created_at) = strftime('%Y-%m', datetime('now', 'localtime'))
        GROUP BY t.type, c.name ORDER BY total DESC
      `
			periodName = "Bulan ini"
		}

		const result = await db.execute(sql)

		// 4. Format Summary
		let dbSummary = `=== DATA KEUANGAN ===\nPeriode: ${periodName}\n\n`
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
			if (intent === "largest") {
				dbSummary += breakdown
			} else {
				dbSummary += `Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}\n`
				dbSummary += `Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}\n\n`
				dbSummary += breakdown
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
