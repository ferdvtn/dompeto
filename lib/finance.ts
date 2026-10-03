import { getJakartaISODate } from "./date-utils"

export interface Category {
	id: number
	name: string
	icon: string
	type: "expense" | "income"
}
export interface Transaction {
	id: number
	amount: number
	type: "expense" | "income"
	category_id: number
	description: string
	notes: string
	date: string
	include_in_budget: number
	raw_input?: string
	category_name?: string
	category_icon?: string
}
export interface Cycle {
	start: string
	end: string
	daysLeft: number
	salary_day: number
	budget: number
	spent: number
	income: number
	expense: number
	remaining: number
	percent: number
}
export const formatIDR = (amount: number) =>
	new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount)
export function dateLabel(date: string) {
	return new Date(date.slice(0, 10) + "T12:00:00+07:00").toLocaleDateString(
		"id-ID",
		{
			day: "numeric",
			month: "short",
			year: "numeric",
			timeZone: "Asia/Jakarta",
		},
	)
}
export function addDays(date: string, days: number) {
	return new Date(Date.parse(date + "T00:00:00Z") + days * 86400000)
		.toISOString()
		.slice(0, 10)
}
export function salaryCycle(
	salaryDay: number,
	today = getJakartaISODate(),
	offset = 0,
) {
	const day =
		Number.isInteger(salaryDay) && salaryDay >= 1 && salaryDay <= 31
			? salaryDay
			: 25
	const [year, month] = today.split("-").map(Number)
	const boundary = (m: number) => {
		const last = new Date(Date.UTC(year, m + 1, 0)).getUTCDate()
		return new Date(Date.UTC(year, m, Math.min(day, last)))
			.toISOString()
			.slice(0, 10)
	}
	const currentMonth =
		month - 1 - (today < boundary(month - 1) ? 1 : 0) + offset
	const start = boundary(currentMonth),
		end = boundary(currentMonth + 1)
	return {
		start,
		end,
		salary_day: day,
		daysLeft: Math.max(
			0,
			Math.ceil((Date.parse(end) - Date.parse(today)) / 86400000),
		),
	}
}
export function budgetSummary(budget: number, spent: number) {
	return {
		budget,
		spent,
		remaining: budget - spent,
		percent:
			budget > 0
				? Math.min(100, Math.max(0, ((budget - spent) / budget) * 100))
				: 0,
	}
}
export function validateTransaction(body: unknown) {
	if (!body || typeof body !== "object")
		throw new Error("Data transaksi tidak valid")
	const b = body as Record<string, unknown>
	if (!Number.isSafeInteger(b.amount) || Number(b.amount) <= 0)
		throw new Error("Nominal harus rupiah bulat lebih dari nol")
	if (b.type !== "income" && b.type !== "expense")
		throw new Error("Jenis transaksi tidak valid")
	if (!Number.isSafeInteger(b.category_id) || Number(b.category_id) <= 0)
		throw new Error("Pilih kategori yang sesuai")
	if (
		typeof b.date !== "string" ||
		!/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
		!Number.isFinite(Date.parse(b.date)) ||
		new Date(b.date).toISOString().slice(0, 10) !== b.date
	)
		throw new Error("Tanggal tidak valid")
	if (
		typeof b.description !== "string" ||
		!b.description.trim() ||
		b.description.length > 500
	)
		throw new Error("Isi keterangan, maksimal 500 karakter")
	if (
		b.notes !== undefined &&
		(typeof b.notes !== "string" || b.notes.length > 2000)
	)
		throw new Error("Catatan maksimal 2000 karakter")
	if (b.include_in_budget !== 0 && b.include_in_budget !== 1)
		throw new Error("Pilihan anggaran tidak valid")
	return {
		amount: Number(b.amount),
		type: b.type,
		category_id: Number(b.category_id),
		date: b.date,
		description: b.description.trim(),
		notes: String(b.notes || ""),
		include_in_budget: b.type === "income" ? 0 : b.include_in_budget,
	}
}
