"use client"

import { useEffect, useState } from "react"
import {
	Search,
	History,
	Filter,
	ArrowLeft,
	Trash2,
	Calendar,
	Tag,
	FileText,
	Info,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CategoryIcon } from "@/components/category-icon"
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer"

export default function TransactionsPage() {
	const router = useRouter()
	const [transactions, setTransactions] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedTx, setSelectedTx] = useState<any>(null)

	const fetchTransactions = () => {
		fetch("/api/transactions")
			.then((res) => res.json())
			.then((data) => {
				setTransactions(data)
				setLoading(false)
			})
	}

	useEffect(() => {
		fetchTransactions()
	}, [])

	const handleDelete = async (id: number) => {
		if (!confirm("Hapus transaksi ini?")) return
		try {
			const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
			if (!res.ok) throw new Error("Gagal menghapus")
			toast.success("Transaksi dihapus")
			setSelectedTx(null)
			fetchTransactions()
		} catch (err: any) {
			toast.error(err.message)
		}
	}

	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount)
	}

	const filtered = transactions.filter(
		(tx) =>
			tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			tx.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			tx.raw_input?.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	if (loading) {
		return (
			<div className="p-4 space-y-4">
				<Skeleton className="h-12 w-full rounded-2xl bg-slate-900/50" />
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-24 w-full rounded-3xl bg-slate-900/50" />
				))}
			</div>
		)
	}

	return (
		<div className="p-4 pb-24 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					size="icon"
					variant="ghost"
					className="rounded-2xl bg-slate-900 border border-white/5 shadow-sm"
					onClick={() => router.back()}
				>
					<ArrowLeft className="w-5 h-5 text-slate-500" />
				</Button>
				<h1 className="text-2xl font-black italic text-slate-100">Riwayat</h1>
			</div>

			{/* Search & Filter */}
			<div className="relative flex-1">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
				<Input
					placeholder="Cari transaksi..."
					className="pl-11 bg-slate-900/40 border-white/5 rounded-2xl h-12 text-xs font-bold shadow-sm focus-visible:ring-emerald-500 text-slate-200"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{/* Transactions List */}
			<div className="space-y-3">
				{filtered.length === 0 ? (
					<div className="bg-slate-950/20 border border-dashed border-white/5 rounded-[2rem] p-12 text-center text-slate-600">
						<History className="w-12 h-12 mx-auto mb-4 opacity-20" />
						<p className="text-xs font-black uppercase tracking-widest italic">
							Data tidak ditemukan
						</p>
					</div>
				) : (
					filtered.map((tx) => (
						<div
							key={tx.id}
							className="group flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-[1.5rem] shadow-premium active:scale-[0.98] transition-all relative overflow-hidden cursor-pointer"
							onClick={() => setSelectedTx(tx)}
						>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-[1rem] bg-slate-800 flex items-center justify-center shadow-inner border border-white/5">
									<CategoryIcon
										name={tx.category_icon || "Wallet"}
										className="w-6 h-6 text-emerald-500/80"
									/>
								</div>
								<div>
									<div className="text-xs font-bold text-slate-100 italic line-clamp-1">
										{tx.description || tx.raw_input}
									</div>
									<div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
										{tx.category_name} •{" "}
										{new Date(tx.created_at).toLocaleDateString("id", {
											day: "2-digit",
											month: "short",
										})}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div
									className={cn(
										"text-xs font-black italic",
										tx.type === "income" ? "text-emerald-400" : "text-red-400",
									)}
								>
									{tx.type === "income" ? "+" : "-"} {formatIDR(tx.amount)}
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Detail Drawer */}
			<Drawer
				open={!!selectedTx}
				onOpenChange={(o: boolean) => !o && setSelectedTx(null)}
			>
				<DrawerContent className="rounded-t-[3rem] bg-[#020617] border-t border-white/5 p-6 pb-12 outline-none">
					<div className="mx-auto w-12 h-1.5 bg-slate-800 rounded-full mb-8" />
					{selectedTx && (
						<div className="space-y-8">
							<DrawerHeader className="p-0 text-left">
								<div className="flex justify-between items-start mb-4">
									<Badge
										className={cn(
											"px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
											selectedTx.type === "income"
												? "bg-emerald-500/10 text-emerald-400"
												: "bg-red-500/10 text-red-400",
										)}
									>
										{selectedTx.type === "income" ? "Pemasukan" : "Pengeluaran"}
									</Badge>
									<span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Calendar className="w-3.5 h-3.5" />
										{new Date(selectedTx.created_at).toLocaleDateString("id", {
											day: "2-digit",
											month: "long",
											year: "numeric",
										})}
									</span>
								</div>
								<DrawerTitle className="text-2xl font-black italic text-slate-100 break-words leading-tight">
									{selectedTx.description || selectedTx.raw_input}
								</DrawerTitle>
								<div className="text-3xl font-black italic mt-2 text-slate-200">
									{selectedTx.type === "expense" ? "-" : "+"}{" "}
									{formatIDR(selectedTx.amount)}
								</div>
							</DrawerHeader>

							<div className="grid grid-cols-1 gap-4">
								<div className="p-4 bg-slate-900/40 rounded-3xl space-y-1 shadow-inner border border-white/5">
									<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Info className="w-3 h-3" /> Input Asli
									</div>
									<div className="text-sm font-bold italic text-slate-300">
										"{selectedTx.raw_input}"
									</div>
								</div>

								<div className="flex gap-4">
									<div className="flex-1 p-4 bg-slate-900/40 border border-white/5 rounded-3xl space-y-1 shadow-sm">
										<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
											<Tag className="w-3 h-3" /> Kategori
										</div>
										<div className="text-sm font-black italic text-slate-200">
											{selectedTx.category_name}
										</div>
									</div>
									<div className="flex-1 p-4 bg-slate-900/40 border border-white/5 rounded-3xl space-y-1 shadow-sm">
										<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
											<FileText className="w-3 h-3" /> Catatan
										</div>
										<div className="text-sm font-bold italic text-slate-400">
											{selectedTx.notes || "-"}
										</div>
									</div>
								</div>
							</div>

							<DrawerFooter className="p-0 pt-4 flex-row gap-4">
								<Button
									variant="outline"
									className="flex-1 h-14 rounded-2xl border-white/10 text-slate-500 font-black uppercase tracking-widest text-[10px] bg-slate-900/20"
									onClick={() => setSelectedTx(null)}
								>
									Tutup
								</Button>
								<Button
									variant="destructive"
									className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-950/20 border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
									onClick={() => handleDelete(selectedTx.id)}
								>
									Hapus
								</Button>
							</DrawerFooter>
						</div>
					)}
				</DrawerContent>
			</Drawer>
		</div>
	)
}
