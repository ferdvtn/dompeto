"use client"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Trash2, ScanLine, Sparkles } from "lucide-react"
import { FormPanel } from "@/components/form-panel"
import {
	TransactionFields,
	emptyDraft,
	draftPayload,
	type Draft,
} from "@/components/transaction-form"
import { type Category, formatIDR, validateTransaction } from "@/lib/finance"
import { api, jsonBody, errorMessage } from "@/lib/client-api"
import { getJakartaISODate } from "@/lib/date-utils"
type ScanItem = {
	name: string
	amount: number
	category: string
	include_in_budget: number
}
type ScanResult = { date: string; items: ScanItem[] }
async function compress(file: File): Promise<string> {
	if (file.size > 20 * 1024 * 1024) throw new Error("Gambar maksimal 20 MB")
	const url = URL.createObjectURL(file)
	try {
		const image = new Image()
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve()
			image.onerror = () =>
				reject(new Error("Gambar tidak dapat dibaca. Gunakan JPG atau PNG."))
			image.src = url
		})
		const scale = Math.min(1, 1200 / Math.max(image.width, image.height)),
			canvas = document.createElement("canvas")
		canvas.width = Math.round(image.width * scale)
		canvas.height = Math.round(image.height * scale)
		const context = canvas.getContext("2d")
		if (!context) throw new Error("Gagal menyiapkan gambar")
		context.drawImage(image, 0, 0, canvas.width, canvas.height)
		return canvas.toDataURL("image/jpeg", 0.8).split(",")[1]
	} finally {
		URL.revokeObjectURL(url)
	}
}
export function AddTransactionModal({
	children,
	onSuccess,
}: {
	children: ReactNode
	onSuccess?: () => void
}) {
	const [open, setOpen] = useState(false)
	const trigger = useRef<HTMLButtonElement>(null)
	return (
		<>
			<button ref={trigger} type="button" onClick={() => setOpen(true)}>
				{children}
			</button>
			{open && (
				<EntryPanel
					onClose={() => {
						setOpen(false)
						requestAnimationFrame(() => trigger.current?.focus())
					}}
					onSuccess={() => onSuccess?.()}
				/>
			)}
		</>
	)
}
function EntryPanel({
	onClose,
	onSuccess,
}: {
	onClose: () => void
	onSuccess: () => void
}) {
	const [tab, setTab] = useState("ai"),
		[text, setText] = useState("")
	const [manual, setManual] = useState(emptyDraft),
		[review, setReview] = useState<Draft | null>(null)
	const [scan, setScan] = useState<ScanResult | null>(null),
		[categories, setCategories] = useState<Category[]>([])
	const [busy, setBusy] = useState(false),
		[error, setError] = useState(""),
		[dirty, setDirty] = useState(false)
	const id = useId()
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
		if (
			!busy &&
			(!dirty || confirm("Buang draft transaksi yang belum disimpan?"))
		)
			onClose()
	}
	const finish = () => {
		toast.success("Transaksi tersimpan")
		onSuccess()
		onClose()
	}
	const run = async (action: () => Promise<void>) => {
		if (busy) return
		setBusy(true)
		setError("")
		try {
			await action()
		} catch (e) {
			setError(errorMessage(e))
		} finally {
			setBusy(false)
		}
	}
	const parse = () =>
		run(async () => {
			const result = await api<{
				type: "expense" | "income"
				amount: number
				description: string
				notes: string
				category: string
			}>("/api/ai/parse", jsonBody({ rawInput: text }))
			setReview({
				...emptyDraft(),
				...result,
				amount: String(result.amount),
				category_id:
					categories.find(
						(c) =>
							c.name.toLowerCase() === result.category.toLowerCase() &&
							c.type === result.type,
					)?.id || 0,
			})
		})
	const save = (draft: Draft, isAI: boolean) =>
		run(async () => {
			const body = validateTransaction(draftPayload(draft))
			await api(
				isAI ? "/api/transactions/confirm" : "/api/transactions/manual",
				jsonBody({ ...body, rawInput: text }),
			)
			finish()
		})
	const groups =
		scan?.items.reduce<ScanItem[]>((all, item) => {
			const existing = all.find(
				(g) =>
					g.category === item.category &&
					g.include_in_budget === item.include_in_budget,
			)
			if (existing) {
				existing.amount += Number(item.amount)
				existing.name = (existing.name + ", " + item.name).slice(0, 500)
			} else all.push({ ...item, amount: Number(item.amount) })
			return all
		}, []) || []
	const validScan =
		!!scan?.items.length &&
		scan.items.every(
			(item) =>
				item.name.trim() &&
				Number.isSafeInteger(item.amount) &&
				item.amount > 0 &&
				categories.some(
					(c) => c.name === item.category && c.type === "expense",
				),
		)
	const updateItem = (index: number, patch: Partial<ScanItem>) => {
		if (scan) {
			setDirty(true)
			setScan({
				...scan,
				items: scan.items.map((item, i) =>
					i === index ? { ...item, ...patch } : item,
				),
			})
		}
	}
	return (
		<FormPanel
			open
			onClose={close}
			title="Catat transaksi"
			footer={
				<>
					<button className="btn" disabled={busy} onClick={close}>
						Batal
					</button>
					<button
						className="btn primary"
						type="submit"
						form={id}
						disabled={
							busy ||
							!categories.length ||
							(tab === "ai" && !review && !text.trim()) ||
							(tab === "scan" && !validScan)
						}
					>
						{busy
							? "Memproses…"
							: tab === "scan"
								? "Simpan semua"
								: tab === "ai" && !review
									? "Proses AI"
									: "Simpan transaksi"}
					</button>
				</>
			}
		>
			<div className="stack">
				<div className="segment" aria-label="Metode pencatatan">
					{[
						["ai", "Ketik AI"],
						["manual", "Manual"],
						["scan", "Scan"],
					].map(([key, label]) => (
						<button
							key={key}
							type="button"
							disabled={busy}
							aria-pressed={tab === key}
							onClick={() => {
								setTab(key)
								setError("")
							}}
						>
							{label}
						</button>
					))}
				</div>
				{error && (
					<div role="alert" className="error">
						{error}
						{!categories.length && (
							<button
								className="btn mt-2"
								onClick={() =>
									run(async () =>
										setCategories(await api<Category[]>("/api/categories")),
									)
								}
							>
								Muat ulang kategori
							</button>
						)}
						{tab === "ai" && (
							<button className="btn mt-2" onClick={() => setTab("manual")}>
								Isi manual
							</button>
						)}
					</div>
				)}
				<form
					id={id}
					onSubmit={(e) => {
						e.preventDefault()
						if (tab === "manual") void save(manual, false)
						else if (tab === "ai") void (review ? save(review, true) : parse())
						else if (scan && validScan)
							void run(async () => {
								await api(
									"/api/transactions/bulk",
									jsonBody({ items: groups, date: scan.date }),
								)
								finish()
							})
					}}
				>
					<fieldset disabled={busy} className="min-w-0">
						{tab === "ai" &&
							(review ? (
								<div className="stack">
									<p className="muted text-sm">
										Periksa hasil AI sebelum menyimpan.
									</p>
									<TransactionFields
										value={review}
										onChange={(d) => {
											setReview(d)
											setDirty(true)
										}}
										categories={categories}
									/>
									<button
										className="btn"
										type="button"
										onClick={() => setReview(null)}
									>
										Ubah teks awal
									</button>
								</div>
							) : (
								<div className="stack">
									<div className="card">
										<Sparkles className="text-primary mb-3" />
										<h2>Ceritakan transaksimu</h2>
										<p className="muted text-sm mt-2">
											Contoh: kopi 20k, atau gaji 10jt. Kamu bisa memeriksa
											hasilnya sebelum disimpan.
										</p>
									</div>
									<label className="field">
										Transaksi
										<textarea
											rows={4}
											maxLength={500}
											required
											value={text}
											placeholder="Tadi makan siang 25rb…"
											onChange={(e) => {
												setText(e.target.value)
												setDirty(true)
											}}
										/>
									</label>
								</div>
							))}
						{tab === "manual" && (
							<TransactionFields
								value={manual}
								onChange={(d) => {
									setManual(d)
									setDirty(true)
								}}
								categories={categories}
							/>
						)}
						{tab === "scan" && (
							<div className="stack">
								<label className="field">
									<span className="row">
										<ScanLine size={20} />
										Foto struk
									</span>
									<input
										type="file"
										accept="image/*"
										onChange={(e) => {
											const file = e.target.files?.[0]
											if (file)
												void run(async () => {
													setDirty(true)
													const image = await compress(file)
													const data = await api<{ scanResult: ScanResult }>(
														"/api/transactions/scan",
														jsonBody({ image }),
													)
													setScan({
														...data.scanResult,
														date: data.scanResult.date || getJakartaISODate(),
														items: data.scanResult.items.map((item) => ({
															...item,
															include_in_budget: 1,
														})),
													})
												})
										}}
									/>
								</label>
								{scan && (
									<>
										<label className="field">
											Tanggal struk
											<input
												type="date"
												required
												value={scan.date}
												onChange={(e) =>
													setScan({ ...scan, date: e.target.value })
												}
											/>
										</label>
										{scan.items.map((item, index) => (
											<div key={index} className="card fields">
												<div className="row between">
													<h2>Item {index + 1}</h2>
													<button
														className="icon-btn text-expense"
														type="button"
														aria-label={`Hapus item ${index + 1}`}
														onClick={() =>
															setScan({
																...scan,
																items: scan.items.filter((_, i) => i !== index),
															})
														}
													>
														<Trash2 size={20} />
													</button>
												</div>
												<label className="field">
													Nama
													<input
														required
														maxLength={500}
														value={item.name}
														onChange={(e) =>
															updateItem(index, { name: e.target.value })
														}
													/>
												</label>
												<label className="field">
													Nominal (Rp)
													<input
														inputMode="numeric"
														pattern="[0-9]+"
														required
														value={item.amount || ""}
														onChange={(e) =>
															updateItem(index, {
																amount: Number(
																	e.target.value.replace(/[^0-9]/g, ""),
																),
															})
														}
													/>
												</label>
												<label className="field">
													Kategori
													<select
														required
														value={
															categories.some(
																(c) =>
																	c.name === item.category &&
																	c.type === "expense",
															)
																? item.category
																: ""
														}
														onChange={(e) =>
															updateItem(index, { category: e.target.value })
														}
													>
														<option value="" disabled>
															Pilih kategori
														</option>
														{categories
															.filter((c) => c.type === "expense")
															.map((c) => (
																<option key={c.id}>{c.name}</option>
															))}
													</select>
												</label>
												<label className="row">
													<input
														type="checkbox"
														checked={item.include_in_budget === 1}
														onChange={(e) =>
															updateItem(index, {
																include_in_budget: e.target.checked ? 1 : 0,
															})
														}
													/>
													Masukkan ke anggaran
												</label>
											</div>
										))}
										<div className="card">
											<h2 className="money">
												Total{" "}
												{formatIDR(
													scan.items.reduce(
														(sum, item) => sum + Number(item.amount),
														0,
													),
												)}
											</h2>
											<p className="muted text-sm mt-2">
												{groups.length} transaksi akan disimpan, dikelompokkan
												berdasarkan kategori dan pilihan anggaran.
											</p>
										</div>
									</>
								)}
							</div>
						)}
					</fieldset>
				</form>
			</div>
		</FormPanel>
	)
}
