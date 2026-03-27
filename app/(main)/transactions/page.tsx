"use client"

import { useEffect, useState } from "react"
import { Search, History, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { TransactionItem } from "@/components/transaction-item"
import { TransactionDetailDrawer } from "@/components/transaction-detail-drawer"

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

	const filtered = transactions.filter(
		(tx) =>
			tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			tx.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			tx.raw_input?.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	if (loading) {
		return (
			<div className="p-4 space-y-4">
				<Skeleton className="h-12 w-full rounded-xl bg-slate-900/50" />
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-900/50" />
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
					className="rounded-xl w-9 h-9 bg-slate-900 border border-white/5 shadow-sm"
					onClick={() => router.back()}
				>
					<ArrowLeft className="w-4 h-4 text-slate-500" />
				</Button>
				<h1 className="text-xl font-black italic text-slate-100">Riwayat</h1>
			</div>

			{/* Search & Filter */}
			<div className="relative flex-1">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
				<Input
					placeholder="Cari transaksi..."
					className="pl-11 bg-slate-900/40 border-white/5 rounded-xl h-11 text-xs font-bold shadow-sm focus-visible:ring-emerald-500 text-slate-200"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{/* Transactions List */}
			<div className="space-y-3">
				{filtered.length === 0 ? (
					<div className="bg-slate-950/20 border border-dashed border-white/5 rounded-2xl p-10 text-center text-slate-600">
						<History className="w-10 h-10 mx-auto mb-3 opacity-20" />
						<p className="text-[10px] font-black uppercase tracking-widest italic">
							Data tidak ditemukan
						</p>
					</div>
				) : (
					filtered.map((tx) => (
						<TransactionItem key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
					))
				)}
			</div>

			<TransactionDetailDrawer
				transaction={selectedTx}
				onClose={() => setSelectedTx(null)}
				onDelete={handleDelete}
			/>
		</div>
	)
}
