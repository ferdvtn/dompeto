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

		// 2. Fetch Settings for Budget & Cycle
		const settingsRes = await db.execute("SELECT key, value FROM settings")
		const settings: { [key: string]: string } = {}
		settingsRes.rows.forEach((row: any) => {
			settings[row.key] = row.value
		})

		const salaryDay = Number(settings.salary_day || "25")
		const budget = Number(settings.monthly_budget || "0")

		// Calculate Cycle Start (same as charts API)
		const [todayY, todayM, todayD] = today.split("-").map(Number)
		let startYear = todayY
		let startMonth = todayM - 1
		if (todayD < salaryDay) {
			startMonth -= 1
			if (startMonth < 0) {
				startMonth = 11
				startYear -= 1
			}
		}
		const cycleStart = `${startYear}-${String(startMonth + 1).padStart(2, "0")}-${String(salaryDay).padStart(2, "0")}`

		// Fetch Net Spent for current cycle
		const cycleRes = await db.execute({
			sql: `
        SELECT SUM(CASE WHEN type = 'expense' THEN amount ELSE -amount END) as spent
        FROM transactions
        WHERE include_in_budget = 1 AND date(date) >= ?
      `,
			args: [cycleStart],
		})
		const spent = Number(cycleRes.rows[0]?.spent || 0)

		// 3. Detect Intent using AI
		const intentData = await detectIntent(message)

		let sql = ""
		let periodName = intentData.label

		// 4. Select SQL based on Intent
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
        WHERE strftime('%Y-%m', t.date) = strftime('%Y-%m', 'now', '+7 hours', '-1 month')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		} else {
			// Dynamic period based on days
			sql = `
        SELECT t.type, c.name as category, SUM(t.amount) as total, COUNT(*) as count 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.date >= datetime('now', '+7 hours', '-${intentData.days} days')
        GROUP BY t.type, c.name ORDER BY total DESC
      `
		}

		const result = sql ? await db.execute(sql) : { rows: [] }

		// 5. Format Summary
		let dbSummary = `[KONTEKS_ANGGARAN]
Siklus Gaji: ${salaryDay}-ke-${salaryDay}
Limit: Rp ${budget.toLocaleString("id-ID")}
Terpakai (Net): Rp ${spent.toLocaleString("id-ID")}
Sisa Budget: Rp ${(budget - spent).toLocaleString("id-ID")}
Status: ${spent > budget ? "OVER BUDGET" : "Aman"}\n\n`

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
				result.rows.forEach((row: any) => {
					if (row.type === "expense") {
						totalExpense += Number(row.total || 0)
						breakdown += `- ${row.category}: Rp ${Number(row.total).toLocaleString("id-ID")} (${row.count}x)\n`
					} else if (row.type === "income") {
						totalIncome += Number(row.total || 0)
						breakdown += `- ${row.category}: Rp ${Number(row.total).toLocaleString("id-ID")} (${row.count}x)\n`
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
