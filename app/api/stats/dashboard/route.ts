import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaISODate } from "@/lib/date-utils"

export async function GET() {
	try {
		const today = getJakartaISODate()

		// 1. Total Balance (Income - Expense)
		const balanceRes = await db.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions
    `)
		const { total_income = 0, total_expense = 0 } = balanceRes.rows[0] as any
		const balance = (total_income || 0) - (total_expense || 0)

		// 2. Daily Metrics (Spent today & Count)
		const dailyRes = await db.execute({
			sql: `
        SELECT 
          SUM(amount) as spent_today,
          COUNT(*) as count_today
        FROM transactions 
        WHERE type = 'expense' AND date(date) = ?
      `,
			args: [today],
		})
		const { spent_today = 0, count_today = 0 } = dailyRes.rows[0] as any

		// 3. Latest 5 Transactions
		const latestRes = await db.execute(`
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC LIMIT 5
    `)

		// 4. Cycle Info (for Settings & UI)
		const settingsRes = await db.execute("SELECT key, value FROM settings")
		const settings: { [key: string]: string } = {}
		settingsRes.rows.forEach((row: any) => {
			settings[row.key] = row.value
		})

		return NextResponse.json({
			balance,
			spentToday: spent_today || 0,
			countToday: count_today || 0,
			latestTransactions: latestRes.rows,
			cycle: {
				salary_day: settings.salary_day || "25",
				budget: settings.monthly_budget || "0",
			},
		})
	} catch (error) {
		console.error("Dashboard Stats Error:", error)
		return NextResponse.json(
			{ error: "Gagal mengambil statistik dashboard." },
			{ status: 500 },
		)
	}
}
