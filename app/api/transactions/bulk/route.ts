import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaDateTime } from "@/lib/date-utils"

export async function POST(request: Request) {
	try {
		const { items, date } = await request.json()

		if (!items || !Array.isArray(items) || items.length === 0) {
			return NextResponse.json({ error: "No items provided" }, { status: 400 })
		}

		// Use provided date or current Jakarta time
		const transactionDate = date ? `${date} 12:00:00` : getJakartaDateTime()

		// Get categories to map names to IDs
		const categoriesRes = await db.execute("SELECT id, name FROM categories")
		const categoryMap = new Map()
		categoriesRes.rows.forEach((row: any) => {
			categoryMap.set(row.name.toLowerCase(), row.id)
		})

		const defaultCategoryId = categoryMap.get("lainnya") || 1

		// Insert items one by one (better for error tracking in this context)
		for (const item of items) {
			const categoryId =
				categoryMap.get(item.category.toLowerCase()) || defaultCategoryId

			await db.execute({
				sql: `
          INSERT INTO transactions (description, amount, type, category_id, date, raw_input, include_in_budget)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
				args: [
					item.name,
					item.amount,
					"expense",
					categoryId,
					transactionDate,
					`Scan: ${item.name}`,
					1, // include_in_budget true by default
				],
			})
		}

		return NextResponse.json({ success: true, count: items.length })
	} catch (error: any) {
		console.error("Bulk Insert Error:", error)
		return NextResponse.json(
			{ error: error.message || "Failed to save transactions" },
			{ status: 500 },
		)
	}
}
