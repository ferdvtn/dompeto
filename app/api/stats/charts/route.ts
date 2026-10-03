import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCycle } from "@/lib/finance-server"
import { addDays } from "@/lib/finance"
import { getJakartaISODate } from "@/lib/date-utils"
export async function GET(req: Request) {
	try {
		const offset = Number(new URL(req.url).searchParams.get("offset") || 0)
		if (!Number.isInteger(offset) || Math.abs(offset) > 1200)
			return NextResponse.json(
				{ error: "Periode tidak valid" },
				{ status: 400 },
			)
		const cycle = await getCycle(offset),
			today = getJakartaISODate()
		const [categories, daily] = await Promise.all([
			db.execute({
				sql: "SELECT c.name,c.icon,SUM(t.amount) AS value FROM transactions t LEFT JOIN categories c ON c.id=t.category_id WHERE t.type='expense' AND date(t.date)>=? AND date(t.date)<? GROUP BY t.category_id ORDER BY value DESC",
				args: [cycle.start, cycle.end],
			}),
			db.execute({
				sql: `SELECT date(date) AS date,SUM(amount) AS amount,
    SUM(CASE WHEN include_in_budget=0 THEN amount ELSE 0 END) AS excludedAmount,
    SUM(CASE WHEN include_in_budget=1 THEN amount ELSE 0 END) AS regularAmount
    FROM transactions WHERE type='expense' AND date(date)>=? AND date(date)<=? GROUP BY date(date)`,
				args: [addDays(today, -6), today],
			}),
		])
		return NextResponse.json({
			cycle,
			categories: categories.rows,
			daily: Array.from({ length: 7 }, (_, i) => {
				const date = addDays(today, i - 6)
				return {
					date,
					amount: 0,
					excludedAmount: 0,
					regularAmount: 0,
					...daily.rows.find((row) => row.date === date),
				}
			}),
		})
	} catch {
		return NextResponse.json(
			{ error: "Gagal mengambil grafik" },
			{ status: 500 },
		)
	}
}
