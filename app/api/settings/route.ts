import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
	try {
		const result = await db.execute("SELECT key, value FROM settings")
		const settings: Record<string, string> = {}
		result.rows.forEach((row: any) => {
			settings[row.key] = row.value
		})
		return NextResponse.json(settings)
	} catch (error) {
		console.error("GET Settings Error:", error)
		return NextResponse.json(
			{ error: "Gagal mengambil pengaturan" },
			{ status: 500 },
		)
	}
}

export async function POST(req: NextRequest) {
	try {
		const data = await req.json()

		// Handle both structured {key, value} and flat {salary_day: X}
		const entries =
			data.key && data.value !== undefined
				? [[data.key, data.value]]
				: Object.entries(data)

		for (const [key, value] of entries) {
			await db.execute({
				sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
				args: [key, String(value)],
			})
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("POST Settings Error:", error)
		return NextResponse.json(
			{ error: "Gagal memperbarui pengaturan" },
			{ status: 500 },
		)
	}
}

export async function PATCH(req: NextRequest) {
	return POST(req)
}
