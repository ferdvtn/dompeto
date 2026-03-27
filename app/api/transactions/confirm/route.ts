import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaISODate } from "@/lib/date-utils"

/**
 * Menyimpan transaksi yang sudah dikonfirmasi pengguna.
 */
export async function POST(req: NextRequest) {
	try {
		const data = await req.json()
		const { rawInput, amount, type, category, description, notes } = data

		// 1. Cari category_id (Case-insensitive & Trimmed)
		const catResult = await db.execute({
			sql: "SELECT id, name FROM categories WHERE name = ? COLLATE NOCASE OR TRIM(name) = TRIM(?) COLLATE NOCASE LIMIT 1",
			args: [category, category],
		})

		let categoryId = catResult.rows[0]?.id

		if (!categoryId) {
			const partialResult = await db.execute({
				sql: "SELECT id, name FROM categories WHERE name LIKE ? LIMIT 1",
				args: [`%${category}%`],
			})
			categoryId = partialResult.rows[0]?.id
		}

		// Final Fallback
		if (!categoryId) {
			categoryId = 10 // Default 'Lainnya'
		}

		// 2. Simpan Transaksi
		const result = await db.execute({
			sql: `
        INSERT INTO transactions (raw_input, amount, type, category_id, description, notes, date, ai_confirmed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 hours'), 1, datetime('now', '+7 hours'), datetime('now', '+7 hours'))
        RETURNING *
      `,
			args: [rawInput, amount, type, categoryId, description, notes],
		})

		// 3. Update Daily Stats
		const today = getJakartaISODate()
		await db.execute({
			sql: `
        INSERT INTO daily_stats (date, transaction_count, total_spent)
        VALUES (?, 1, ?)
        ON CONFLICT(date) DO UPDATE SET
          transaction_count = transaction_count + 1,
          total_spent = total_spent + EXCLUDED.total_spent
      `,
			args: [today, type === "expense" ? amount : 0],
		})

		return NextResponse.json(result.rows[0], { status: 201 })
	} catch (error) {
		console.error("Confirm Transaction Error:", error)
		return NextResponse.json(
			{ error: "Gagal menyimpan transaksi" },
			{ status: 500 },
		)
	}
}
