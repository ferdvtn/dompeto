import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
	try {
		// 1. Pie Chart: Breakdown per category (Last 30 days)
		const pieRes = await db.execute(`
      SELECT c.name, SUM(t.amount) as value
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense' AND t.created_at >= date('now', '-30 days')
      GROUP BY c.name
    `)

		// 2. Line Chart: Daily Trend (Last 14 days)
		const lineRes = await db.execute(`
      SELECT date(created_at) as date, SUM(amount) as amount
      FROM transactions
      WHERE type = 'expense' AND created_at >= date('now', '-14 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `)

		// 3. Bar Chart: Category vs Total (Last 30 days)
		// Same as pie but maybe formatted differently if needed

		// 4. Monthly Cycle (Salary Cycle: 25th to 25th)
		const now = new Date()
		let startYear = now.getFullYear()
		let startMonth = now.getMonth() // 0-indexed
		if (now.getDate() < 25) {
			startMonth -= 1
			if (startMonth < 0) {
				startMonth = 11
				startYear -= 1
			}
		}
		const cycleStart = `${startYear}-${String(startMonth + 1).padStart(2, "0")}-25`

		const cycleRes = await db.execute({
			sql: `
        SELECT SUM(amount) as total_spent
        FROM transactions
        WHERE type = 'expense' AND date(created_at) >= ?
      `,
			args: [cycleStart],
		})

		// Get budget from settings
		const budgetRes = await db.execute(
			"SELECT value FROM settings WHERE key = 'monthly_budget' LIMIT 1",
		)
		const budget = Number(budgetRes.rows[0]?.value) || 2000000 // Default 2jt if not set

		return NextResponse.json({
			pieData: pieRes.rows,
			lineData: lineRes.rows,
			cycle: {
				spent: Number(cycleRes.rows[0]?.total_spent) || 0,
				budget: budget,
				start: cycleStart,
			},
		})
	} catch (error) {
		console.error("Charts API Error:", error)
		return NextResponse.json(
			{ error: "Gagal mengambil data grafik" },
			{ status: 500 },
		)
	}
}
