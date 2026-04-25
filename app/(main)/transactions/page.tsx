"use client"

import { useEffect, useState, useRef } from "react"
import { Search, History, ArrowLeft, Loader2, ArrowDown, ArrowUp } from "lucide-react"
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

	const [debouncedSearch, setDebouncedSearch] = useState("")
	const [sort, setSort] = useState("desc")
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)
	const [isFetchingMore, setIsFetchingMore] = useState(false)
	const observerTarget = useRef<HTMLDivElement>(null)

	const handleSortToggle = () => {
		setSort((prev) => (prev === "desc" ? "asc" : "desc"))
		setPage(1)
		setTransactions([])
		setHasMore(true)
	}

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchQuery !== debouncedSearch) {
				setDebouncedSearch(searchQuery)
				setPage(1)
				setTransactions([])
				setHasMore(true)
			}
		}, 1000)
		return () => clearTimeout(timer)
	}, [searchQuery, debouncedSearch])

	const fetchTransactions = async (currentPage: number, searchStr: string, sortStr: string, isRefresh = false) => {
		try {
			if (currentPage === 1 && !isRefresh) setLoading(true)
			else if (currentPage > 1) setIsFetchingMore(true)

			const res = await fetch(
				`/api/transactions?page=${currentPage}&limit=20&search=${encodeURIComponent(searchStr)}&sort=${sortStr}`
			)
			const { data, hasMore: more } = await res.json()

			if (currentPage === 1) {
				setTransactions(data)
			} else {
				setTransactions((prev) => {
					// Prevent duplicates just in case
					const existingIds = new Set(prev.map(t => t.id))
					const newData = data.filter((t: any) => !existingIds.has(t.id))
					return [...prev, ...newData]
				})
			}
			setHasMore(more)
		} catch (err) {
			toast.error("Gagal memuat transaksi")
		} finally {
			setLoading(false)
			setIsFetchingMore(false)
		}
	}

	useEffect(() => {
		fetchTransactions(page, debouncedSearch, sort)
	}, [page, debouncedSearch, sort])

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isFetchingMore && !loading) {
					setPage((prev) => prev + 1)
				}
			},
			{ threshold: 0.1 }
		)

		if (observerTarget.current) {
			observer.observe(observerTarget.current)
		}

		return () => observer.disconnect()
	}, [hasMore, isFetchingMore, loading])

	const handleDelete = async (id: number) => {
		if (!confirm("Hapus transaksi ini?")) return
		try {
			const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
			if (!res.ok) throw new Error("Gagal menghapus")
			toast.success("Transaksi dihapus")
			setSelectedTx(null)
			// Refresh current data
			setPage(1)
			fetchTransactions(1, debouncedSearch, sort, true)
		} catch (err: any) {
			toast.error(err.message)
		}
	}

	return (
		<div className="p-4 pb-5 space-y-6">
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
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
					<Input
						placeholder="Cari transaksi..."
						className="pl-11 bg-slate-900/40 border border-white/5 rounded-xl h-11 text-xs font-bold shadow-sm focus-visible:ring-emerald-500 text-slate-200"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Button
					variant="outline"
					className="h-11 px-3 rounded-xl bg-slate-900/40 border border-white/5 text-slate-400 hover:text-emerald-400 active:scale-95 transition-all"
					onClick={handleSortToggle}
				>
					{sort === "desc" ? <ArrowDown className="w-4 h-4 mr-1.5" /> : <ArrowUp className="w-4 h-4 mr-1.5" />}
					<span className="text-[9px] font-black uppercase tracking-widest">
						{sort === "desc" ? "Terbaru" : "Terlama"}
					</span>
				</Button>
			</div>

			{/* Transactions List */}
			<div className="space-y-3">
				{loading ? (
					[...Array(6)].map((_, i) => (
						<Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-800/30" />
					))
				) : transactions.length === 0 ? (
					<div className="bg-slate-900/20 border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-600">
						<History className="w-10 h-10 mx-auto mb-3 opacity-20" />
						<p className="text-[10px] font-black uppercase tracking-widest italic">
							Data tidak ditemukan
						</p>
					</div>
				) : (
					transactions.map((tx) => (
						<TransactionItem key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
					))
				)}

				<div ref={observerTarget} className="h-10 flex items-center justify-center pt-2">
					{isFetchingMore && (
						<div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold italic">
							<Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
							Memuat data...
						</div>
					)}
				</div>
			</div>

			<TransactionDetailDrawer
				transaction={selectedTx}
				onClose={() => setSelectedTx(null)}
				onDelete={handleDelete}
				onUpdate={() => {
					setPage(1)
					fetchTransactions(1, debouncedSearch, sort, true)
				}}
			/>
		</div>
	)
}
