import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest) {
	try {
		const { key, value } = await req.json()

		if (!key || value === undefined) {
			return NextResponse.json(
				{ error: "Key and Value are required" },
				{ status: 400 },
			)
		}

		await db.execute({
			sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
			args: [key, String(value)],
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("PATCH Settings Error:", error)
		return NextResponse.json(
			{ error: "Gagal memperbarui pengaturan" },
			{ status: 500 },
		)
	}
}
