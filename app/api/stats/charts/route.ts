import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaISODate } from "@/lib/date-utils"

export async function GET() {
	try {
		// 1. Get settings first
		const settingsRes = await db.execute("SELECT key, value FROM settings")
		const settings: { [key: string]: string } = {}
		settingsRes.rows.forEach((row: any) => {
			settings[row.key] = row.value
		})

		const salaryDay = Number(settings.salary_day || "25")
		const budget = Number(settings.monthly_budget || "0")

		// 2. Pie Chart: Breakdown per category (Last 30 days)
		const pieRes = await db.execute(`
      SELECT c.name, SUM(t.amount) as value
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense' AND date(t.date) >= date('now', '+7 hours', '-30 days')
      GROUP BY c.name
    `)

		// 3. Line Chart: Daily Trend (Last 7 days)
		// Use -6 days to get exactly 7 days including today
		const lineRes = await db.execute(`
      SELECT date(date) as date, SUM(amount) as amount
      FROM transactions
      WHERE type = 'expense' AND date(date) >= date('now', '+7 hours', '-6 days')
      GROUP BY date(date)
      ORDER BY date ASC
    `)

		// Normalize data to ensure 7 entries (even if 0)
		const today = getJakartaISODate()
		const dailyData: { [key: string]: number } = {}
		lineRes.rows.forEach((row: any) => {
			dailyData[row.date] = Number(row.amount) || 0
		})

		const last7Days = []
		for (let i = 6; i >= 0; i--) {
			const d = new Date()
			d.setHours(d.getHours() + 7) // Jakarta time
			d.setDate(d.getDate() - i)
			const dateStr = d.toISOString().split("T")[0]
			last7Days.push({
				date: dateStr,
				amount: dailyData[dateStr] || 0,
			})
		}

		// 4. Monthly Cycle (Salary Cycle)
		// Get current Jakarta date info
		const todayStr = getJakartaISODate()
		const [todayY, todayM, todayD] = todayStr.split("-").map(Number)

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

		const cycleRes = await db.execute({
			sql: `
        SELECT 
          SUM(CASE WHEN type = 'expense' THEN amount ELSE -amount END) as total_spent
        FROM transactions
        WHERE include_in_budget = 1 AND date(date) >= ?
      `,
			args: [cycleStart],
		})

		// Calculate days left relative to current Jakarta date
		const start = new Date(startYear, startMonth, salaryDay)
		const nextCycle = new Date(startYear, startMonth + 1, salaryDay)
		const todayDate = new Date(todayY, todayM - 1, todayD)
		const diffMs = nextCycle.getTime() - todayDate.getTime()
		const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

		const spent = Number(cycleRes.rows[0]?.total_spent) || 0
		const percent =
			budget > 0 ? Math.max(0, ((budget - spent) / budget) * 100) : 0

		return NextResponse.json({
			categories: pieRes.rows,
			daily: last7Days,
			cycle: {
				spent: spent,
				budget: budget,
				start: cycleStart,
				daysLeft: daysLeft,
				percent: percent, // Budget remaining percentage
				salary_day: salaryDay,
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
