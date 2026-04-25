import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getJakartaDateTime } from "@/lib/date-utils"
import { parseTransaction } from "@/lib/ai"

export async function GET(req: NextRequest) {
	try {
		const url = req.nextUrl
		const search = url.searchParams.get("search") || ""
		const page = parseInt(url.searchParams.get("page") || "1", 10)
		const limit = parseInt(url.searchParams.get("limit") || "20", 10)
		const sortParam = url.searchParams.get("sort") === "asc" ? "ASC" : "DESC"
		const offset = (page - 1) * limit

		let baseQuery = `
        SELECT t.*, c.name as category_name, c.icon as category_icon 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
      `
		const queryParams: any[] = []

		if (search) {
			baseQuery += ` WHERE t.description LIKE ? OR c.name LIKE ? OR t.raw_input LIKE ?`
			const searchPattern = `%${search}%`
			queryParams.push(searchPattern, searchPattern, searchPattern)
		}

		baseQuery += ` ORDER BY t.date ${sortParam}, t.created_at ${sortParam} LIMIT ? OFFSET ?`
		queryParams.push(limit, offset)

		const result = await db.execute({
			sql: baseQuery,
			args: queryParams,
		})
		const hasMore = result.rows.length === limit
		return NextResponse.json({ data: result.rows, hasMore })
	} catch (error) {
		console.error("GET Transactions Error:", error)
		return NextResponse.json(
			{ error: "Gagal mengambil data transaksi." },
			{ status: 500 },
		)
	}
}

export async function POST(req: NextRequest) {
	try {
		const { rawInput } = await req.json()

		if (!rawInput || typeof rawInput !== "string" || rawInput.length > 200) {
			return NextResponse.json(
				{ error: "Input tidak valid (maks 200 karakter)." },
				{ status: 400 },
			)
		}

		// 1. Ekstraksi data menggunakan AI
		let parsedData = await parseTransaction(rawInput)

		// FALLBACK: Sederhana jika AI gagal
		if (!parsedData) {
			const { parseRupiah } = await import("@/lib/rupiah")
			const parts = rawInput.split(/\s+/)
			const lastPart = parts[parts.length - 1]
			const amount = parseRupiah(lastPart)

			if (amount) {
				const lowInput = rawInput.toLowerCase()
				const isIncome = lowInput.includes("gajian") || lowInput.includes("terima")
				parsedData = {
					amount,
					type: isIncome ? "income" : "expense",
					category: isIncome ? "Pemasukan" : "Lainnya",
					description: parts.slice(0, -1).join(" ") || rawInput,
					notes: "Fallback",
				}
			}
		}

		if (!parsedData) {
			return NextResponse.json(
				{ error: "Gagal memproses transaksi. Coba format: 'beli bakso 15k'" },
				{ status: 422 },
			)
		}

		// 2. Cari category_id berdasarkan nama kategori dari AI
		const catResult = await db.execute({
			sql: "SELECT id FROM categories WHERE name = ? LIMIT 1",
			args: [parsedData.category],
		})
		const categoryId = catResult.rows[0]?.id || 10 // Default ke 'Lainnya'

		// 3. Simpan ke database
		const result = await db.execute({
			sql: `
        INSERT INTO transactions (raw_input, amount, type, category_id, description, notes, include_in_budget, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 hours'), datetime('now', '+7 hours'))
        RETURNING *
      `,
			args: [
				rawInput,
				parsedData.amount,
				parsedData.type,
				categoryId,
				parsedData.description,
				parsedData.notes,
				1, // Default to included in budget for chat entries
				getJakartaDateTime(), // Current Jakarta time as business date
			],
		})

		return NextResponse.json(result.rows[0], { status: 201 })
	} catch (error) {
		console.error("POST Transaction Error:", error)
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal." },
			{ status: 500 },
		)
	}
}
