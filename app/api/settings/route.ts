import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
export async function GET() {
	try {
		const result = await db.execute("SELECT key,value FROM settings")
		return NextResponse.json(
			Object.fromEntries(
				result.rows.map((row) => [String(row.key), String(row.value)]),
			),
		)
	} catch {
		return NextResponse.json(
			{ error: "Gagal mengambil pengaturan" },
			{ status: 500 },
		)
	}
}
export async function POST(req: NextRequest) {
	try {
		const data = await req.json()
		const entries: [string, unknown][] =
			data.key && data.value !== undefined
				? [[data.key, data.value]]
				: Object.entries(data)
		if (
			!entries.length ||
			entries.some(([key, value]) => {
				if (typeof value !== "string" && typeof value !== "number") return true
				const num = Number(value)
				return (
					!String(value).trim() ||
					!Number.isSafeInteger(num) ||
					(key === "salary_day"
						? num < 1 || num > 31
						: key === "monthly_budget"
							? num < 0
							: true)
				)
			})
		)
			return NextResponse.json(
				{
					error: "Tanggal gaji harus 1–31 dan anggaran rupiah bulat nonnegatif",
				},
				{ status: 400 },
			)
		await db.batch(
			entries.map(([key, value]) => ({
				sql: "INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)",
				args: [key, String(value)],
			})),
			"write",
		)
		return NextResponse.json({ success: true })
	} catch {
		return NextResponse.json(
			{ error: "Gagal menyimpan pengaturan" },
			{ status: 500 },
		)
	}
}
export const PATCH = POST
