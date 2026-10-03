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
		if (typeof message !== "string" || !message.trim() || message.length > 2000) return NextResponse.json({ error: "Pesan harus berisi 1–2000 karakter" }, { status: 400 })
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

		const { getCycle } = await import("@/lib/finance-server")
		const { budget, spent, start, end } = await getCycle()

		// 3. Detect Intent using AI
		const intentData = await detectIntent(message)

		let sql = ""
		const args: string[] = []
		const days = Math.min(3660, Math.max(1, Math.trunc(Number(intentData.days) || 1)))
		const periodName = intentData.label

		// 4. Select SQL based on Intent
		if (intentData.intent === "unclear") {
			sql = "" // No data needed
		} else if (intentData.intent === "largest") {
			args.push(`-${days} days`)
			sql = `
        SELECT t.description, t.amount, t.type, c.name as category 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.date >= datetime('now', '+7 hours', ?)
        ORDER BY t.amount DESC LIMIT 5
      `
		} else if (intentData.label.toLowerCase() === "hari ini") {
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE date(t.date) = date('now', '+7 hours')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		} else if (intentData.label.toLowerCase() === "kemarin") {
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE date(t.date) = date('now', '+7 hours', '-1 day')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		} else if (intentData.label.toLowerCase().includes("bulan lalu")) {
			// Special handling for calendar last month
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE strftime('%Y-%m', t.date) = strftime('%Y-%m', 'now', '+7 hours', '-1 month')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		} else {
			args.push(`-${days - 1} days`)
			// Dynamic period based on days (range)
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE date(t.date) >= date('now', '+7 hours', ?)
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		}

		const result = sql ? await db.execute({ sql, args }) : { rows: [] }

		// 5. Format Summary
		let dbSummary = `[KONTEKS_ANGGARAN]
Siklus Gaji: ${start} sampai sebelum ${end}
Limit: Rp ${budget.toLocaleString("id-ID")}
Pengeluaran terikut anggaran: Rp ${spent.toLocaleString("id-ID")}
Sisa Budget: Rp ${(budget - spent).toLocaleString("id-ID")}
Pemasukan tidak menambah limit anggaran.
Status: ${budget <= 0 ? "Anggaran belum diatur" : spent > budget ? "OVER BUDGET" : "Dalam anggaran"}\n\n`

		if (intentData.intent === "unclear") {
			dbSummary += `[UNCLEAR]`
		} else if (intentData.intent === "write") {
			dbSummary += `[INSTRUKSI] Tolak CRUD`
		} else {
			dbSummary += `[REKAP_TRANSAKSI_${periodName.toUpperCase()}]
(Mencakup semua transaksi termasuk yang di-skip dari budget)
`
			if (result.rows.length === 0) {
				dbSummary += "Tidak ditemukan data."
			} else {
				let totalExpense = 0
				let totalIncome = 0
				let breakdown = "Kategori:\n"
				result.rows.forEach((row) => {
					if (intentData.intent === "largest") {
						breakdown += `- ${row.category}: Rp ${Number(row.amount).toLocaleString("id-ID")} (${row.description || "Tanpa deskripsi"})\n`
					} else {
						if (row.type === "expense") {
							totalExpense += Number(row.total || 0)
							breakdown += `- ${row.category}: Rp ${Number(row.total).toLocaleString("id-ID")} (${row.count}x)\n`
						} else if (row.type === "income") {
							totalIncome += Number(row.total || 0)
							breakdown += `- ${row.category}: Rp ${Number(row.total).toLocaleString("id-ID")} (${row.count}x)\n`
						}
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
