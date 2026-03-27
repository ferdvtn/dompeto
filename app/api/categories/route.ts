import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
	try {
		const result = await db.execute(
			"SELECT * FROM categories ORDER BY is_default DESC, name ASC",
		)
		return NextResponse.json(result.rows)
	} catch (error) {
		console.error("GET Categories Error:", error)
		return NextResponse.json(
			{ error: "Gagal mengambil kategori" },
			{ status: 500 },
		)
	}
}
