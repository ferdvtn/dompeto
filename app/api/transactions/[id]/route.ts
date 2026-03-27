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
		const { description, amount, type, category_id } = await req.json()

		await db.execute({
			sql: `
        UPDATE transactions 
        SET description = ?, amount = ?, type = ?, category_id = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `,
			args: [description, amount, type, category_id, id],
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
