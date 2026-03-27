import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
	try {
		// 1. Reset dynamic tables
		await db.execute("DELETE FROM transactions")
		await db.execute("DELETE FROM daily_stats")

		// 2. Reset settings to default values
		await db.execute("UPDATE settings SET value = '25' WHERE key = 'salary_day'")
		await db.execute(
			"UPDATE settings SET value = '0' WHERE key = 'monthly_budget'",
		)

		return NextResponse.json({
			success: true,
			message: "Database berhasil direset",
		})
	} catch (error) {
		console.error("Reset Database Error:", error)
		return NextResponse.json({ error: "Gagal meriset database" }, { status: 500 })
	}
}
