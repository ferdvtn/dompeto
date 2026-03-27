import { NextRequest, NextResponse } from "next/server"
import { parseTransaction } from "@/lib/ai"
import { db } from "@/lib/db"

/**
 * Hanya memparsing input teks menggunakan AI tanpa menyimpan ke DB.
 * Digunakan untuk alur konfirmasi UX.
 */
export async function POST(req: NextRequest) {
	try {
		const { rawInput } = await req.json()

		if (!rawInput) {
			return NextResponse.json({ error: "Input kosong" }, { status: 400 })
		}

		const parsed = await parseTransaction(rawInput)

		if (!parsed) {
			return NextResponse.json({ error: "Gagal memproses AI" }, { status: 422 })
		}

		// Track Usage (Consolidated into daily_stats)
		const today = new Date().toISOString().split("T")[0]
		try {
			await db.execute({
				sql: "INSERT INTO daily_stats (date, chat_used) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET chat_used = chat_used + 1",
				args: [today],
			})
		} catch (e) {
			console.error("Failed to track chat usage", e)
		}

		return NextResponse.json(parsed)
	} catch (error) {
		console.error("AI Parse API Error:", error)
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
	}
}
