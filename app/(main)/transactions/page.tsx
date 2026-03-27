"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Filter, History, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { EditTransactionModal } from "@/components/edit-transaction-modal"

interface Transaction {
	id: number
	description: string
	raw_input: string
	amount: number
	type: "expense" | "income"
	category_id: number
	category_name: string
	category_icon: string
	created_at: string
}

export default function TransactionsPage() {
	const router = useRouter()
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState("")

	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null)

	const [deletingId, setDeletingId] = useState<number | null>(null)

	const fetchTransactions = async () => {
		try {
			const res = await fetch("/api/transactions")
			const data = await res.json()
			setTransactions(data)
		} catch (err) {
			toast.error("Gagal memuat transaksi")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTransactions()
	}, [])

	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount)
	}

	const handleDeleteRequest = (id: number) => {
		setDeletingId(id)

		const toastId = toast("Transaksi dihapus", {
			description: "Anda memiliki 10 detik untuk membatalkan.",
			action: {
				label: "Urungkan",
				onClick: () => {
					setDeletingId(null)
					toast.dismiss(toastId)
					toast.success("Penghapusan dibatalkan")
				},
			},
			duration: 10000,
			onAutoClose: async () => {
				// Only if still in deleting state
				setTransactions((prev) => {
					const isSTillDeleting = prev.some((t) => t.id === id) && true // Simple check
					return prev
				})

				try {
					const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
					if (res.ok) {
						setTransactions((prev) => prev.filter((t) => t.id !== id))
						setDeletingId(null)
					}
				} catch (err) {
					console.error("Failed to delete", err)
				}
			},
		})
	}

	const handleEdit = (tx: Transaction) => {
		setSelectedTransaction(tx)
		setIsEditModalOpen(true)
	}

	// Group transactions by date
	const groupedTransactions = transactions
		.filter((t) => !deletingId || t.id !== deletingId)
		.filter(
			(t) =>
				t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.raw_input?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.category_name?.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
			const date = new Date(transaction.created_at).toLocaleDateString("id", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			})
			if (!groups[date]) groups[date] = []
			groups[date].push(transaction)
			return groups
		}, {})

	if (loading) {
		return (
			<div className="p-4 space-y-4">
				<Skeleton className="h-10 w-32" />
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-20 w-full rounded-2xl" />
				))}
			</div>
		)
	}

	return (
		<div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full bg-gray-900 border border-gray-800"
					onClick={() => router.back()}
				>
					<ArrowLeft className="w-5 h-5" />
				</Button>
				<h1 className="text-xl font-black italic">Riwayat Transaksi</h1>
			</div>

			{/* Search & Filter */}
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
					<Input
						placeholder="Cari transaksi..."
						className="pl-9 bg-gray-900 border-gray-800 rounded-2xl h-12 text-sm focus-visible:ring-emerald-500"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Button
					variant="outline"
					size="icon"
					className="bg-gray-900 border-gray-800 rounded-2xl h-12 w-12"
				>
					<Filter className="w-4 h-4" />
				</Button>
			</div>

			{/* Transactions List */}
			<div className="space-y-8">
				{Object.entries(groupedTransactions).length === 0 ? (
					<div className="text-center py-20 opacity-50">
						<History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
						<p className="text-sm font-bold italic uppercase tracking-widest">
							Kosong
						</p>
					</div>
				) : (
					Object.entries(groupedTransactions).map(([date, items]) => (
						<div key={date} className="space-y-4">
							<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-2">
								{date}
							</h3>
							<div className="space-y-3">
								{items.map((tx) => (
									<div
										key={tx.id}
										className={cn(
											"group relative flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-3xl transition-all shadow-lg active:scale-[0.98]",
										)}
									>
										<div className="flex items-center gap-4">
											<div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-xl shadow-inner font-black text-gray-600 uppercase">
												{tx.category_name?.substring(0, 1)}
											</div>
											<div>
												<div className="text-sm font-bold text-gray-100 line-clamp-1 italic">
													{tx.description || tx.raw_input}
												</div>
												<div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
													{tx.category_name} •{" "}
													{new Date(tx.created_at).toLocaleTimeString("id", {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</div>
											</div>
										</div>
										<div className="flex flex-col items-end">
											<div
												className={cn(
													"text-sm font-black italic",
													tx.type === "income" ? "text-emerald-400" : "text-red-400",
												)}
											>
												{tx.type === "income" ? "+" : "-"} {formatIDR(tx.amount)}
											</div>
											<div className="flex gap-2 mt-2">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-xl bg-gray-800/50 text-gray-500 hover:text-cyan-400"
													onClick={() => handleEdit(tx)}
												>
													<Edit2 className="w-4 h-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-xl bg-gray-800/50 text-gray-500 hover:text-red-400"
													onClick={() => handleDeleteRequest(tx.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					))
				)}
			</div>

			<EditTransactionModal
				transaction={selectedTransaction}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				onSuccess={fetchTransactions}
			/>
		</div>
	)
}
