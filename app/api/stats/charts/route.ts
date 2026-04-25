import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaISODate } from "@/lib/date-utils"

export async function GET(req: Request) {
	try {
		const url = new URL(req.url)
		const offset = parseInt(url.searchParams.get("offset") || "0", 10)

		// 1. Get settings first
		const settingsRes = await db.execute("SELECT key, value FROM settings")
		const settings: { [key: string]: string } = {}
		settingsRes.rows.forEach((row: any) => {
			settings[row.key] = row.value
		})

		const salaryDay = Number(settings.salary_day || "25")
		const budget = Number(settings.monthly_budget || "0")

		// 2. Compute Cycle Dates with Offset
		const todayStr = getJakartaISODate()
		const [todayY, todayM, todayD] = todayStr.split("-").map(Number)

		let startYear = todayY
		let startMonth = todayM - 1
		if (todayD < salaryDay) {
			startMonth -= 1
		}

		// Apply offset
		startMonth += offset

		// Normalize month and year after offset
		while (startMonth < 0) {
			startMonth += 12
			startYear -= 1
		}
		while (startMonth > 11) {
			startMonth -= 12
			startYear += 1
		}

		const cycleStart = `${startYear}-${String(startMonth + 1).padStart(2, "0")}-${String(salaryDay).padStart(2, "0")}`

		let endMonth = startMonth + 1
		let endYear = startYear
		if (endMonth > 11) {
			endMonth = 0
			endYear += 1
		}
		const cycleEnd = `${endYear}-${String(endMonth + 1).padStart(2, "0")}-${String(salaryDay).padStart(2, "0")}`

		// 3. Pie Chart: Breakdown per category for this cycle
		const pieRes = await db.execute({
			sql: `
        SELECT c.name, c.icon, SUM(t.amount) as value
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.type = 'expense' AND date(t.date) >= ? AND date(t.date) < ?
        GROUP BY c.name
        ORDER BY value DESC
      `,
			args: [cycleStart, cycleEnd],
		})

		// 4. Line Chart: Daily Trend (Last 7 days relative to today, as requested to ignore changes for now)
		const lineRes = await db.execute(`
      SELECT date(date) as date, SUM(amount) as amount
      FROM transactions
      WHERE type = 'expense' AND date(date) >= date('now', '+7 hours', '-6 days')
      GROUP BY date(date)
      ORDER BY date ASC
    `)

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

		// 5. Monthly Cycle (Salary Cycle) Total Spent
		const cycleRes = await db.execute({
			sql: `
        SELECT 
          SUM(CASE WHEN type = 'expense' THEN amount ELSE -amount END) as total_spent
        FROM transactions
        WHERE include_in_budget = 1 AND date(date) >= ? AND date(date) < ?
      `,
			args: [cycleStart, cycleEnd],
		})

		// Calculate days left relative to current Jakarta date
		const nextCycle = new Date(endYear, endMonth, salaryDay)
		const todayDate = new Date(todayY, todayM - 1, todayD)
		const diffMs = nextCycle.getTime() - todayDate.getTime()
		const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

		const spent = Number(cycleRes.rows[0]?.total_spent) || 0
		const percent = budget > 0 ? Math.max(0, ((budget - spent) / budget) * 100) : 0

		return NextResponse.json({
			categories: pieRes.rows,
			daily: last7Days,
			cycle: {
				spent: spent,
				budget: budget,
				start: cycleStart,
				end: cycleEnd,
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
