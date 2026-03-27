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

export async function POST(req: Request) {
	try {
		const { name, icon, color, type } = await req.json()
		const result = await db.execute({
			sql: "INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?) RETURNING *",
			args: [name, icon || "📂", color || "#ffffff", type || "expense"],
		})
		return NextResponse.json(result.rows[0], { status: 201 })
	} catch (error) {
		console.error("POST Category Error:", error)
		return NextResponse.json(
			{ error: "Gagal menambah kategori" },
			{ status: 500 },
		)
	}
}
