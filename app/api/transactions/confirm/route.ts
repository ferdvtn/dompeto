import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkedTransaction } from "@/lib/finance-server"
import { getJakartaISODate } from "@/lib/date-utils"
export async function POST(req: Request) {
	let data, rawInput
	try {
		const body = await req.json()
		const category = await db.execute({
			sql: "SELECT id FROM categories WHERE name=? COLLATE NOCASE AND type=?",
			args: [body.category || "", body.type],
		})
		data = await checkedTransaction({
			...body,
			category_id: body.category_id ?? Number(category.rows[0]?.id),
			date: body.date || getJakartaISODate(),
			include_in_budget: body.include_in_budget ?? 1,
		})
		rawInput =
			typeof body.rawInput === "string" ? body.rawInput : data.description
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Data tidak valid" },
			{ status: 400 },
		)
	}
	try {
		const result = await db.execute({
			sql: `INSERT INTO transactions (raw_input,amount,type,category_id,description,notes,date,ai_confirmed,include_in_budget,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,?,datetime('now','+7 hours'),datetime('now','+7 hours')) RETURNING *`,
			args: [
				rawInput,
				data.amount,
				data.type,
				data.category_id,
				data.description,
				data.notes,
				data.date,
				data.include_in_budget,
			],
		})
		return NextResponse.json(result.rows[0], { status: 201 })
	} catch {
		return NextResponse.json(
			{ error: "Gagal menyimpan transaksi" },
			{ status: 500 },
		)
	}
}
