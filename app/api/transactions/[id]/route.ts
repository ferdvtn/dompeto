import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		await db.execute({
			sql: "DELETE FROM transactions WHERE id = ?",
			args: [id],
		})
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("DELETE Transaction Error:", error)
		return NextResponse.json(
			{ error: "Gagal menghapus transaksi" },
			{ status: 500 },
		)
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const body = await req.json()
		const { description, amount, type, category_id, date } = body
		let { include_in_budget } = body

		// If include_in_budget is not provided, fetch the existing one
		if (include_in_budget === undefined) {
			const existing = await db.execute({
				sql: "SELECT include_in_budget FROM transactions WHERE id = ?",
				args: [id],
			})
			include_in_budget = existing.rows[0]?.include_in_budget
		}

		await db.execute({
			sql: `
        UPDATE transactions 
        SET description = ?, amount = ?, type = ?, category_id = ?, date = ?, include_in_budget = ?, updated_at = datetime('now', '+7 hours')
        WHERE id = ?
      `,
			args: [
				description,
				amount,
				type,
				category_id,
				date,
				Number(include_in_budget ?? 1),
				id,
			],
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("PATCH Transaction Error:", error)
		return NextResponse.json(
			{ error: "Gagal memperbarui transaksi" },
			{ status: 500 },
		)
	}
}
