"use client"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { FormPanel } from "@/components/form-panel"
import {
	TransactionFields,
	draftPayload,
	type Draft,
} from "@/components/transaction-form"
import {
	type Transaction,
	type Category,
	formatIDR,
	dateLabel,
	validateTransaction,
} from "@/lib/finance"
import { api, jsonBody, errorMessage } from "@/lib/client-api"
export function TransactionDetailDrawer({
	transaction,
	onClose,
	onUpdate,
}: {
	transaction: Transaction | null
	onClose: () => void
	onUpdate: () => void
	onDelete?: (id: number) => void
}) {
	return transaction ? (
		<Detail
			key={transaction.id}
			transaction={transaction}
			onClose={onClose}
			onUpdate={onUpdate}
		/>
	) : null
}
function Detail({
	transaction: tx,
	onClose,
	onUpdate,
}: {
	transaction: Transaction
	onClose: () => void
	onUpdate: () => void
}) {
	const [editing, setEditing] = useState(false),
		[dirty, setDirty] = useState(false),
		[busy, setBusy] = useState(false),
		[error, setError] = useState("")
	const [categories, setCategories] = useState<Category[]>([])
	const [draft, setDraft] = useState<Draft>({
		...tx,
		amount: String(tx.amount),
		date: tx.date.slice(0, 10),
		notes: tx.notes || "",
	})
	const formRef = useRef<HTMLFormElement>(null)
	useEffect(() => {
		const controller = new AbortController()
		api<Category[]>("/api/categories", { signal: controller.signal })
			.then(setCategories)
			.catch((e) => {
				if (!controller.signal.aborted) setError(errorMessage(e))
			})
		return () => controller.abort()
	}, [])
	const close = () => {
		if (!busy && (!dirty || confirm("Buang perubahan yang belum disimpan?")))
			onClose()
	}
	const perform = async (remove = false) => {
		if (busy) return
		if (
			remove &&
			!confirm(
				`Hapus transaksi “${tx.description}” sebesar ${formatIDR(tx.amount)}?`,
			)
		)
			return
		setBusy(true)
		setError("")
		try {
			await api(
				`/api/transactions/${tx.id}`,
				remove
					? { method: "DELETE" }
					: jsonBody(validateTransaction(draftPayload(draft)), "PATCH"),
			)
			toast.success(remove ? "Transaksi dihapus" : "Perubahan disimpan")
			onUpdate()
			onClose()
		} catch (e) {
			setError(errorMessage(e))
		} finally {
			setBusy(false)
		}
	}
	return (
		<FormPanel
			open
			onClose={close}
			title={editing ? "Edit transaksi" : "Detail transaksi"}
			footer={
				editing ? (
					<>
						<button type="button" className="btn" disabled={busy} onClick={close}>
							Batal
						</button>
						<button
							key="save"
							type="button"
							className="btn primary"
							disabled={busy || !dirty || !categories.length}
							onClick={() => {
								if (formRef.current?.reportValidity()) void perform()
							}}
						>
							{busy ? "Menyimpan…" : "Simpan perubahan"}
						</button>
					</>
				) : (
					<>
						<button
							type="button"
							className="btn danger"
							disabled={busy}
							onClick={() => perform(true)}
						>
							Hapus
						</button>
						<button
							key="edit"
							type="button"
							className="btn primary"
							onClick={() => setEditing(true)}
						>
							Edit transaksi
						</button>
					</>
				)
			}
		>
			{error && (
				<p className="error mb-4" role="alert">
					{error}
				</p>
			)}
			{editing ? (
				<form ref={formRef} onSubmit={(e) => e.preventDefault()}>
					<fieldset disabled={busy}>
						<TransactionFields
							value={draft}
							categories={categories}
							onChange={(d) => {
								setDraft(d)
								setDirty(true)
							}}
						/>
					</fieldset>
				</form>
			) : (
				<div className="stack">
					<div>
						<p className="muted">
							{tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
						</p>
						<p
							className={`text-3xl money mt-2 ${tx.type === "income" ? "text-income" : "text-expense"}`}
						>
							{formatIDR(tx.amount)}
						</p>
					</div>
					<h2>{tx.description}</h2>
					<dl className="fields">
						<div>
							<dt className="muted text-sm">Kategori</dt>
							<dd>{tx.category_name}</dd>
						</div>
						<div>
							<dt className="muted text-sm">Tanggal</dt>
							<dd>{dateLabel(tx.date)}</dd>
						</div>
						<div>
							<dt className="muted text-sm">Catatan</dt>
							<dd className="whitespace-pre-wrap">
								{tx.notes || "Tidak ada catatan"}
							</dd>
						</div>
						{tx.type === "expense" && (
							<div>
								<dt className="muted text-sm">Anggaran</dt>
								<dd>
									{tx.include_in_budget ? "Masuk anggaran" : "Di luar anggaran"}
								</dd>
							</div>
						)}
					</dl>
				</div>
			)}
		</FormPanel>
	)
}
