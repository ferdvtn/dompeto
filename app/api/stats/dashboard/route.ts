import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaISODate } from "@/lib/date-utils"
import { getCycle } from "@/lib/finance-server"
export async function GET() {
	try {
		const [balance, daily, latest, cycle] = await Promise.all([
			db.execute(
				"SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0) AS balance FROM transactions",
			),
			db.execute({
				sql: "SELECT COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS spent, COUNT(*) AS count FROM transactions WHERE date(date)=?",
				args: [getJakartaISODate()],
			}),
			db.execute(
				"SELECT t.*, c.name AS category_name, c.icon AS category_icon FROM transactions t LEFT JOIN categories c ON t.category_id=c.id ORDER BY t.date DESC,t.created_at DESC,t.id DESC LIMIT 5",
			),
			getCycle(),
		])
		return NextResponse.json({
			balance: Number(balance.rows[0].balance),
			spentToday: Number(daily.rows[0].spent),
			countToday: Number(daily.rows[0].count),
			latestTransactions: latest.rows,
			cycle,
		})
	} catch {
		return NextResponse.json(
			{ error: "Gagal mengambil ringkasan" },
			{ status: 500 },
		)
	}
}
