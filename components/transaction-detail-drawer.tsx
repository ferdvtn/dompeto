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
	const [isUpdating, setIsUpdating] = useState(false)
	const [localTx, setLocalTx] = useState<any>(null)

	useEffect(() => {
		if (transaction) {
			setLocalTx(transaction)
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
	}, [transaction])

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
			<DrawerContent className="rounded-t-[2rem] bg-[#0f172a] border-t border-white/5 p-6 pb-12 outline-none">
				<div className="mx-auto w-10 h-1 bg-slate-800 rounded-full mb-6" />
				{localTx && (
					<div className="space-y-8">
						<DrawerHeader className="p-0 text-left">
							<div className="flex justify-between items-center mb-4">
								<Badge
									className={cn(
										"px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
										localTx.type === "income"
											? "bg-emerald-500/10 text-emerald-400"
											: "bg-red-500/10 text-red-400",
									)}
								>
									{localTx.type === "income" ? "Pemasukan" : "Pengeluaran"}
								</Badge>

								{isEditingDate ? (
									<div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 shadow-lg animate-in fade-in zoom-in duration-200">
										<input
											type="datetime-local"
											className="bg-transparent text-[10px] font-black uppercase text-slate-100 outline-none border-none [color-scheme:dark]"
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
													<Loader2 className="w-3.5 h-3.5 animate-spin" />
												) : (
													<Check className="w-3.5 h-3.5" />
												)}
											</button>
											<button
												onClick={() => setIsEditingDate(false)}
												className="p-1 hover:bg-red-500/20 rounded-md text-red-400 transition-colors"
											>
												<X className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>
								) : (
									<button
										onClick={() => setIsEditingDate(true)}
										className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:text-emerald-500 transition-all bg-slate-900/40 px-3 py-1.5 rounded-full border border-white/5 active:scale-95"
									>
										<Calendar className="w-3.5 h-3.5" />
										{new Date(localTx.date).toLocaleDateString("id", {
											day: "2-digit",
											month: "long",
											year: "numeric",
										})}{" "}
										{new Date(localTx.date).toLocaleTimeString("id", {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</button>
								)}
							</div>
							<DrawerTitle className="text-xl font-black italic text-slate-100 break-words leading-tight">
								{localTx.description || localTx.raw_input}
							</DrawerTitle>
							<div className="text-2xl font-black italic mt-1 text-slate-200">
								{localTx.type === "expense" ? "-" : "+"} {formatIDR(localTx.amount)}
							</div>
						</DrawerHeader>

						<div className="grid grid-cols-1 gap-3">
							<div className="p-3.5 bg-slate-900/40 rounded-2xl space-y-1 shadow-inner border border-white/5">
								<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
									<Info className="w-3 h-3" /> Input Asli
								</div>
								<div className="text-[13px] font-bold italic text-slate-300 break-words whitespace-pre-wrap">
									"{localTx.raw_input}"
								</div>
							</div>

							<div className="flex gap-3">
								<div className="flex-1 p-3.5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-1 shadow-sm">
									<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Tag className="w-3 h-3" /> Kategori
									</div>
									<div className="text-[13px] font-black italic text-slate-200">
										{localTx.category_name}
									</div>
								</div>
								<div className="flex-1 p-3.5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-1 shadow-sm overflow-hidden">
									<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<FileText className="w-3 h-3" /> Catatan
									</div>
									<div className="text-[13px] font-bold italic text-slate-400 break-words whitespace-pre-wrap">
										{localTx.notes || "-"}
									</div>
								</div>
							</div>

							{/* Include in Budget Toggle */}
							<div className="p-3.5 bg-slate-900/40 rounded-2xl flex items-center justify-between border border-white/5 shadow-inner">
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
										<p className="text-[10px] font-black italic text-slate-100 uppercase tracking-tight">
											Libatkan Anggaran
										</p>
										<p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
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

						<DrawerFooter className="p-0 pt-4 flex-row gap-3">
							<Button
								variant="outline"
								className="flex-1 h-11 rounded-xl border-white/10 text-slate-500 font-black uppercase tracking-widest text-[9px] bg-slate-900/20"
								onClick={onClose}
							>
								Tutup
							</Button>
							<Button
								variant="destructive"
								className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-red-950/20 border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
								onClick={() => onDelete(localTx.id)}
							>
								Hapus
							</Button>
						</DrawerFooter>
					</div>
				)}
			</DrawerContent>
		</Drawer>
	)
}
