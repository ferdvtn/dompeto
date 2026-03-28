import {
	Calendar,
	Tag,
	FileText,
	Info,
	Loader2,
	Check,
	X,
	PieChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer"

interface TransactionDetailDrawerProps {
	transaction: any
	onClose: () => void
	onDelete: (id: number) => void
	onUpdate?: () => void
}

export function TransactionDetailDrawer({
	transaction,
	onClose,
	onDelete,
	onUpdate,
}: TransactionDetailDrawerProps) {
	const [isEditingDate, setIsEditingDate] = useState(false)
	const [editedDate, setEditedDate] = useState("")
	const [isEditingAmount, setIsEditingAmount] = useState(false)
	const [editedAmount, setEditedAmount] = useState("")
	const [isEditingCategory, setIsEditingCategory] = useState(false)
	const [editedCategoryId, setEditedCategoryId] = useState<number | string>("")
	const [categories, setCategories] = useState<any[]>([])
	const [isUpdating, setIsUpdating] = useState(false)
	const [localTx, setLocalTx] = useState<any>(null)

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await fetch("/api/categories")
				if (res.ok) {
					const data = await res.json()
					setCategories(data)
				}
			} catch (err) {
				console.error("Gagal mengambil kategori:", err)
			}
		}
		fetchCategories()
	}, [])

	useEffect(() => {
		if (transaction) {
			setLocalTx(transaction)
			setEditedAmount(String(transaction.amount))
			setEditedCategoryId(transaction.category_id)
			// Format to YYYY-MM-DDTHH:MM for input type="datetime-local"
			const dateVal = transaction.date
			const date = new Date(dateVal)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, "0")
			const day = String(date.getDate()).padStart(2, "0")
			const hours = String(date.getHours()).padStart(2, "0")
			const minutes = String(date.getMinutes()).padStart(2, "0")
			setEditedDate(`${year}-${month}-${day}T${hours}:${minutes}`)
		} else {
			setLocalTx(null)
		}
		setIsEditingDate(false)
		setIsEditingAmount(false)
		setIsEditingCategory(false)
	}, [transaction])

	const handleUpdateCategory = async (newCategoryId: number) => {
		if (!localTx) return
		setIsUpdating(true)
		try {
			const res = await fetch(`/api/transactions/${localTx.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description: localTx.description,
					amount: localTx.amount,
					type: localTx.type,
					category_id: newCategoryId,
					date: localTx.date,
					include_in_budget: localTx.include_in_budget,
				}),
			})

			if (!res.ok) throw new Error("Gagal memperbarui kategori")

			toast.success("Kategori diperbarui")

			// Update UI immediately inside the drawer
			const newCategory = categories.find((c) => c.id === newCategoryId)
			setLocalTx((prev: any) => ({
				...prev,
				category_id: newCategoryId,
				category_name: newCategory?.name || prev.category_name,
			}))

			setIsEditingCategory(false)
			if (onUpdate) onUpdate()
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setIsUpdating(false)
		}
	}

	const handleUpdateAmount = async () => {
		if (!localTx) return
		const amountValue = Number(editedAmount)
		if (isNaN(amountValue) || amountValue < 0) {
			toast.error("Nominal tidak valid")
			return
		}

		setIsUpdating(true)
		try {
			const res = await fetch(`/api/transactions/${localTx.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description: localTx.description,
					amount: amountValue,
					type: localTx.type,
					category_id: localTx.category_id,
					date: localTx.date,
					include_in_budget: localTx.include_in_budget,
				}),
			})

			if (!res.ok) throw new Error("Gagal memperbarui nominal")

			toast.success("Nominal diperbarui")

			// Update UI immediately inside the drawer
			setLocalTx((prev: any) => ({
				...prev,
				amount: amountValue,
			}))

			setIsEditingAmount(false)
			if (onUpdate) onUpdate()
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setIsUpdating(false)
		}
	}

	const handleToggleBudget = async () => {
		if (!localTx) return
		const newValue = localTx.include_in_budget === 1 ? 0 : 1
		setIsUpdating(true)
		try {
			const res = await fetch(`/api/transactions/${localTx.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description: localTx.description,
					amount: localTx.amount,
					type: localTx.type,
					category_id: localTx.category_id,
					date: localTx.date,
					include_in_budget: newValue,
				}),
			})

			if (!res.ok) throw new Error("Gagal memperbarui anggaran")

			toast.success(
				newValue === 1 ? "Dilibatkan dalam anggaran" : "Dikecualikan dari anggaran",
			)

			// Update UI immediately inside the drawer
			setLocalTx((prev: any) => ({
				...prev,
				include_in_budget: newValue,
			}))

			if (onUpdate) onUpdate()
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setIsUpdating(false)
		}
	}

	const handleUpdateDate = async () => {
		if (!localTx) return
		setIsUpdating(true)
		try {
			// Convert YYYY-MM-DDTHH:MM back to YYYY-MM-DD HH:MM:SS for DB
			const dbDate = editedDate.replace("T", " ") + ":00"

			const res = await fetch(`/api/transactions/${localTx.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description: localTx.description,
					amount: localTx.amount,
					type: localTx.type,
					category_id: localTx.category_id,
					date: dbDate,
					include_in_budget: localTx.include_in_budget,
				}),
			})

			if (!res.ok) throw new Error("Gagal memperbarui tanggal")

			toast.success("Tanggal & waktu diperbarui")

			// Update UI immediately inside the drawer
			setLocalTx((prev: any) => ({
				...prev,
				date: dbDate,
			}))

			setIsEditingDate(false)
			if (onUpdate) onUpdate()
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setIsUpdating(false)
		}
	}

	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount)
	}

	return (
		<Drawer open={!!transaction} onOpenChange={(o) => !o && onClose()}>
			<DrawerContent className="rounded-t-[2rem] bg-[#0f172a] border-t border-white/5 outline-none max-h-[96dvh] flex flex-col shadow-2xl overflow-hidden">
				<div className="mx-auto w-10 h-1 bg-slate-800 rounded-full my-4 shrink-0" />
				{localTx && (
					<>
						<div className="flex-1 overflow-y-auto px-6 pb-2 custom-scrollbar">
							<div className="space-y-6 py-2">
								<DrawerHeader className="p-0 text-left">
									<div className="flex justify-between items-center mb-3">
										<Badge
											className={cn(
												"px-3 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border-none",
												localTx.type === "income"
													? "bg-emerald-500/10 text-emerald-400"
													: "bg-red-500/10 text-red-400",
											)}
										>
											{localTx.type === "income" ? "Pemasukan" : "Pengeluaran"}
										</Badge>

										{isEditingDate ? (
											<div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/10 shadow-lg animate-in fade-in zoom-in duration-200">
												<input
													type="datetime-local"
													className="bg-transparent text-[7px] font-black uppercase text-slate-100 outline-none border-none [color-scheme:dark]"
													value={editedDate}
													onChange={(e) => setEditedDate(e.target.value)}
													autoFocus
												/>
												<div className="flex items-center gap-1 border-l border-white/10 pl-2">
													<button
														onClick={handleUpdateDate}
														disabled={isUpdating}
														className="p-1 hover:bg-emerald-500/20 rounded-md text-emerald-500 transition-colors disabled:opacity-50"
													>
														{isUpdating ? (
															<Loader2 className="w-3 h-3 animate-spin" />
														) : (
															<Check className="w-3 h-3" />
														)}
													</button>
													<button
														onClick={() => setIsEditingDate(false)}
														className="p-1 hover:bg-red-500/20 rounded-md text-red-400 transition-colors"
													>
														<X className="w-3 h-3" />
													</button>
												</div>
											</div>
										) : (
											<button
												onClick={() => setIsEditingDate(true)}
												className="text-[7px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:text-emerald-500 transition-all bg-slate-900/40 px-2.5 py-1 rounded-full border border-white/5 active:scale-95"
											>
												<Calendar className="w-3 h-3" />
												{new Date(localTx.date).toLocaleDateString("id", {
													day: "2-digit",
													month: "short",
													year: "numeric",
												})}{" "}
												{new Date(localTx.date).toLocaleTimeString("id", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</button>
										)}
									</div>
									<DrawerTitle className="text-sm font-black italic text-slate-100 break-words leading-tight line-clamp-2">
										{localTx.description || localTx.raw_input}
									</DrawerTitle>
									{isEditingAmount ? (
										<div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-white/10 shadow-lg animate-in fade-in zoom-in duration-200 mt-2">
											<span className="text-xs font-black italic text-slate-500">Rp</span>
											<input
												type="number"
												className="bg-transparent text-lg font-black italic text-slate-100 outline-none border-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
												value={editedAmount}
												onChange={(e) => setEditedAmount(e.target.value)}
												autoFocus
												onKeyDown={(e) => e.key === "Enter" && handleUpdateAmount()}
											/>
											<div className="flex items-center gap-1 border-l border-white/10 pl-2">
												<button
													onClick={handleUpdateAmount}
													disabled={isUpdating}
													className="p-1.5 hover:bg-emerald-500/20 rounded-md text-emerald-500 transition-colors disabled:opacity-50"
												>
													{isUpdating ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<Check className="w-4 h-4" />
													)}
												</button>
												<button
													onClick={() => setIsEditingAmount(false)}
													className="p-1.5 hover:bg-red-500/20 rounded-md text-red-400 transition-colors"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
										</div>
									) : (
										<button
											onClick={() => setIsEditingAmount(true)}
											className="text-md font-black italic mt-0.5 text-slate-200 hover:text-emerald-400 transition-colors"
										>
											{localTx.type === "expense" ? "-" : "+"} {formatIDR(localTx.amount)}
										</button>
									)}
								</DrawerHeader>

								<div className="grid grid-cols-1 gap-3">
									<div className="p-3 bg-slate-900/40 rounded-2xl space-y-1 shadow-inner border border-white/5">
										<div className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
											<Info className="w-3 h-3" /> Input Asli
										</div>
										<div className="text-[10px] font-bold italic text-slate-300 break-words whitespace-pre-wrap">
											"{localTx.raw_input}"
										</div>
									</div>

									<div className="flex gap-3">
										<div
											className={cn(
												"flex-1 p-3 bg-slate-900/40 border border-white/5 rounded-2xl space-y-1 shadow-sm transition-all",
												isEditingCategory && "ring-1 ring-emerald-500/30 bg-slate-900/60",
											)}
										>
											<div className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Tag className="w-3 h-3" /> Kategori
												</div>
												{!isEditingCategory && (
													<button
														onClick={() => setIsEditingCategory(true)}
														className="text-[7px] text-emerald-500 hover:underline"
													>
														UBAH
													</button>
												)}
											</div>
											{isEditingCategory ? (
												<div className="flex items-center gap-2 pt-1">
													<select
														className="flex-1 bg-slate-800 text-[10px] font-black uppercase text-slate-100 outline-none border-none rounded px-1 py-0.5 appearance-none"
														value={localTx.category_id}
														onChange={(e) => handleUpdateCategory(Number(e.target.value))}
														autoFocus
													>
														{categories.map((c) => (
															<option key={c.id} value={c.id}>
																{c.name}
															</option>
														))}
													</select>
													<button
														onClick={() => setIsEditingCategory(false)}
														className="text-slate-500 hover:text-red-400"
													>
														<X className="w-3 h-3" />
													</button>
												</div>
											) : (
												<button
													onClick={() => setIsEditingCategory(true)}
													className="text-[10px] font-black italic text-slate-200 text-left hover:text-emerald-400 transition-colors w-full"
												>
													{localTx.category_name}
												</button>
											)}
										</div>
										<div className="flex-1 p-3 bg-slate-900/40 border border-white/5 rounded-2xl space-y-1 shadow-sm overflow-hidden">
											<div className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
												<FileText className="w-3 h-3" /> Catatan
											</div>
											<div className="text-[10px] font-bold italic text-slate-400 break-words whitespace-pre-wrap">
												{localTx.notes || "-"}
											</div>
										</div>
									</div>

									{/* Include in Budget Toggle */}
									<div className="p-3 bg-slate-900/40 rounded-2xl flex items-center justify-between border border-white/5 shadow-inner">
										<div className="flex items-center gap-3">
											<div
												className={cn(
													"p-2 rounded-xl transition-all duration-300",
													localTx.include_in_budget === 1
														? "bg-emerald-500/10 text-emerald-400"
														: "bg-slate-800 text-slate-600",
												)}
											>
												<PieChart className="w-3.5 h-3.5" />
											</div>
											<div className="text-left">
												<p className="text-[8px] font-black italic text-slate-100 uppercase tracking-tight">
													Libatkan Anggaran
												</p>
												<p className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter">
													Pengaruhi sisa kuota gaji
												</p>
											</div>
										</div>
										<button
											onClick={handleToggleBudget}
											disabled={isUpdating}
											className={cn(
												"w-10 h-5 rounded-full relative transition-all duration-300 active:scale-95 shadow-lg",
												localTx.include_in_budget === 1
													? "bg-emerald-600 shadow-emerald-500/10"
													: "bg-slate-800",
											)}
										>
											<div
												className={cn(
													"absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
													localTx.include_in_budget === 1 ? "left-6" : "left-1",
												)}
											/>
										</button>
									</div>
								</div>
							</div>
						</div>

						<DrawerFooter className="p-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,1.5rem))] border-t border-white/5 bg-[#070b1a]/80 backdrop-blur-md shrink-0 flex-row gap-3">
							<Button
								variant="outline"
								className="flex-1 h-11 rounded-xl border-white/10 text-slate-500 font-black uppercase tracking-widest text-[7px] bg-slate-900/20"
								onClick={onClose}
							>
								Tutup
							</Button>
							<Button
								variant="destructive"
								className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[7px] shadow-xl shadow-red-950/20 border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
								onClick={() => onDelete(localTx.id)}
							>
								Hapus
							</Button>
						</DrawerFooter>
					</>
				)}
			</DrawerContent>
		</Drawer>
	)
}
