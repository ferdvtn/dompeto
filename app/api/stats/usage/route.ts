import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
	try {
		const today = new Date().toISOString().split("T")[0]
		const result = await db.execute({
			sql: "SELECT chat_used FROM daily_stats WHERE date = ?",
			args: [today],
		})

		const count = result.rows.length > 0 ? Number(result.rows[0].chat_used) : 0

		return NextResponse.json({ count })
	} catch (error) {
		console.error("GET Usage Error:", error)
		return NextResponse.json(
			{ error: "Gagal mengambil data penggunaan" },
			{ status: 500 },
		)
	}
}
