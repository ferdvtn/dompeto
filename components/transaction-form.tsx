"use client"
import { useEffect, useId, useRef } from "react"
import { type Category, type Transaction, formatIDR } from "@/lib/finance"
import { getJakartaISODate } from "@/lib/date-utils"
export type Draft = Pick<
	Transaction,
	| "type"
	| "category_id"
	| "description"
	| "notes"
	| "date"
	| "include_in_budget"
> & { amount: string }
export const emptyDraft = (): Draft => ({
	type: "expense",
	amount: "",
	category_id: 0,
	description: "",
	notes: "",
	date: getJakartaISODate(),
	include_in_budget: 1,
})
export const draftPayload = (draft: Draft) => ({
	...draft,
	amount: Number(draft.amount),
	include_in_budget: draft.type === "income" ? 0 : draft.include_in_budget,
})
export function TransactionFields({
	value,
	onChange,
	categories,
}: {
	value: Draft
	onChange: (draft: Draft) => void
	categories: Category[]
}) {
	const id = useId()
	const amountInput = useRef<HTMLInputElement>(null)
	const amountError = value.amount && (!Number.isSafeInteger(Number(value.amount)) || Number(value.amount) <= 0)
		? "Isi nominal rupiah bulat lebih dari nol, maksimal 9.007.199.254.740.991." : ""
	useEffect(() => { amountInput.current?.setCustomValidity(amountError) }, [amountError])
	const change = (patch: Partial<Draft>) => onChange({ ...value, ...patch })
	return (
		<div className="fields">
			<label className="field" htmlFor={`${id}-type`}>
				Jenis
				<select
					id={`${id}-type`}
					value={value.type}
					onChange={(e) =>
						change({ type: e.target.value as Draft["type"], category_id: 0 })
					}
				>
					<option value="expense">Pengeluaran</option>
					<option value="income">Pemasukan</option>
				</select>
			</label>
			<label className="field" htmlFor={`${id}-amount`}>
				Nominal (Rp)
				<input
					id={`${id}-amount`}
					ref={amountInput}
					aria-invalid={!!amountError}
					aria-describedby={`${id}-amount-help`}
					required
					inputMode="numeric"
					pattern="[0-9]+"
					maxLength={16}
					value={value.amount}
					onChange={(e) =>
						change({ amount: e.target.value.replace(/[^0-9]/g, "") })
					}
					placeholder="Contoh: 25000"
				/>
				<span id={`${id}-amount-help`} className={amountError ? "error" : "muted text-xs"}>
					{amountError || formatIDR(Number(value.amount) || 0)}
				</span>
			</label>
			<label className="field" htmlFor={`${id}-category`}>
				Kategori
				<select
					id={`${id}-category`}
					required
					value={value.category_id || ""}
					onChange={(e) => change({ category_id: Number(e.target.value) })}
				>
					<option value="" disabled>
						Pilih kategori
					</option>
					{categories
						.filter((c) => c.type === value.type)
						.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
				</select>
			</label>
			<label className="field" htmlFor={`${id}-date`}>
				Tanggal
				<input
					id={`${id}-date`}
					required
					type="date"
					value={value.date}
					onChange={(e) => change({ date: e.target.value })}
				/>
			</label>
			<label className="field" htmlFor={`${id}-description`}>
				Keterangan
				<input
					id={`${id}-description`}
					required
					maxLength={500}
					value={value.description}
					onChange={(e) => change({ description: e.target.value })}
					placeholder={
						value.type === "income" ? "Gaji bulan ini" : "Makan siang"
					}
				/>
			</label>
			<label className="field" htmlFor={`${id}-notes`}>
				Catatan <span className="muted text-xs">Opsional</span>
				<textarea
					id={`${id}-notes`}
					rows={2}
					maxLength={2000}
					value={value.notes}
					onChange={(e) => change({ notes: e.target.value })}
				/>
			</label>
			{value.type === "expense" ? (
				<label className="row min-h-12">
					<input
						type="checkbox"
						checked={value.include_in_budget === 1}
						onChange={(e) =>
							change({ include_in_budget: e.target.checked ? 1 : 0 })
						}
					/>
					Masukkan ke anggaran
				</label>
			) : (
				<p className="muted text-sm">
					Pemasukan menambah saldo, bukan batas anggaran.
				</p>
			)}
		</div>
	)
}
