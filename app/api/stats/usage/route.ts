import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaISODate } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
	try {
		const today = getJakartaISODate()
		const result = await db.execute({
			sql: "SELECT chat_used, parse_used FROM daily_stats WHERE date = ?",
			args: [today],
		})

		const stats = (result.rows[0] as any) || {
			chat_used: 0,
			parse_used: 0,
		}

		return NextResponse.json({
			chatUsed: Number(stats.chat_used) || 0,
			parseUsed: Number(stats.parse_used) || 0,
		})
	} catch (error) {
		console.error("GET Usage Error:", error)
		return NextResponse.json(
			{ error: "Gagal mengambil data penggunaan" },
			{ status: 500 },
		)
	}
}
