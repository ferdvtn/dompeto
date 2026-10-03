import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkedTransaction } from "@/lib/finance-server"
export async function POST(req: Request) {
	let data
	try {
		data = await checkedTransaction(await req.json())
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Data tidak valid" },
			{ status: 400 },
		)
	}
	try {
		const result = await db.execute({
			sql: `INSERT INTO transactions (raw_input,amount,type,category_id,description,notes,date,ai_confirmed,include_in_budget,created_at,updated_at) VALUES (?,?,?,?,?,?,?,0,?,datetime('now','+7 hours'),datetime('now','+7 hours')) RETURNING *`,
			args: [
				data.description,
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
