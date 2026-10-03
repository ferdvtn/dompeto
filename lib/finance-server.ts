import { db } from "@/lib/db"
import { salaryCycle, budgetSummary, validateTransaction } from "@/lib/finance"

export async function getCycle(offset = 0) {
	const settings = await db.execute("SELECT key, value FROM settings")
	const values = Object.fromEntries(
		settings.rows.map((row) => [String(row.key), String(row.value)]),
	)
	const cycle = salaryCycle(Number(values.salary_day || 25), undefined, offset)
	const result = await db.execute({
		sql: `SELECT
 COALESCE(SUM(CASE WHEN type='expense' AND include_in_budget=1 THEN amount ELSE 0 END),0) AS spent,
 COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS expense,
 COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) AS income
 FROM transactions WHERE date(date)>=? AND date(date)<?`,
		args: [cycle.start, cycle.end],
	})
	const row = result.rows[0]
	return {
		...cycle,
		...budgetSummary(Number(values.monthly_budget || 0), Number(row.spent)),
		income: Number(row.income),
		expense: Number(row.expense),
	}
}
export async function checkedTransaction(body: unknown) {
	const data = validateTransaction(body)
	const category = await db.execute({
		sql: "SELECT type FROM categories WHERE id=?",
		args: [data.category_id],
	})
	if (category.rows[0]?.type !== data.type)
		throw new Error("Kategori tidak sesuai jenis transaksi")
	return data
}
