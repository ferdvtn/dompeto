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
	const { id } = await params
	let data
	try {
		const existing = await db.execute({
			sql: "SELECT * FROM transactions WHERE id=?",
			args: [id],
		})
		if (!existing.rows.length)
			return NextResponse.json(
				{ error: "Transaksi tidak ditemukan" },
				{ status: 404 },
			)
		const { checkedTransaction } = await import("@/lib/finance-server")
		data = await checkedTransaction({
			...existing.rows[0],
			date: String(existing.rows[0].date).slice(0, 10),
			...(await req.json()),
		})
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Data tidak valid" },
			{ status: 400 },
		)
	}
	try {
		await db.execute({
			sql: "UPDATE transactions SET description=?,amount=?,type=?,category_id=?,date=?,notes=?,include_in_budget=?,updated_at=datetime('now','+7 hours') WHERE id=?",
			args: [
				data.description,
				data.amount,
				data.type,
				data.category_id,
				data.date,
				data.notes,
				data.include_in_budget,
				id,
			],
		})
		return NextResponse.json({ success: true })
	} catch {
		return NextResponse.json(
			{ error: "Gagal memperbarui transaksi" },
			{ status: 500 },
		)
	}
}
