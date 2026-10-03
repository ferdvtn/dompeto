import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateTransaction } from "@/lib/finance"
import { getJakartaISODate } from "@/lib/date-utils"
export async function POST(req: Request) {
	let transactions
	try {
		const { items, date } = await req.json()
		if (!Array.isArray(items) || !items.length || items.length > 200)
			throw new Error("Jumlah item harus 1–200")
		const categories = await db.execute(
			"SELECT id,name FROM categories WHERE type='expense'",
		)
		transactions = items.map((item) =>
			validateTransaction({
				amount: item.amount,
				type: "expense",
				category_id: Number(
					categories.rows.find(
						(c) =>
							String(c.name).toLowerCase() ===
							String(item.category).toLowerCase(),
					)?.id,
				),
				date: date || getJakartaISODate(),
				description: item.name,
				notes: "Hasil scan struk",
				include_in_budget: item.include_in_budget ?? 1,
			}),
		)
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Data tidak valid" },
			{ status: 400 },
		)
	}
	try {
		await db.batch(
			transactions.map((t) => ({
				sql: `INSERT INTO transactions (raw_input,amount,type,category_id,description,notes,date,ai_confirmed,include_in_budget,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,?,datetime('now','+7 hours'),datetime('now','+7 hours'))`,
				args: [
					`Scan: ${t.description}`,
					t.amount,
					t.type,
					t.category_id,
					t.description,
					t.notes,
					t.date,
					t.include_in_budget,
				],
			})),
			"write",
		)
		return NextResponse.json(
			{ success: true, count: transactions.length },
			{ status: 201 },
		)
	} catch {
		return NextResponse.json(
			{ error: "Gagal menyimpan transaksi. Tidak ada item yang disimpan." },
			{ status: 500 },
		)
	}
}
