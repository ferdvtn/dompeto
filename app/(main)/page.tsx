"use client"

import { useEffect, useState, useCallback } from "react"
import {
	Plus,
	Wallet,
	TrendingDown,
	TrendingUp,
	ArrowUpRight,
	History,
	Calendar,
	Tag,
	FileText,
	Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { TransactionItem } from "@/components/transaction-item"
import { TransactionDetailDrawer } from "@/components/transaction-detail-drawer"

interface DashboardData {
	balance: number
	spentToday: number
	countToday: number
	latestTransactions: any[]
}

export default function Dashboard() {
	const router = useRouter()
	const [data, setData] = useState<DashboardData | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedTx, setSelectedTx] = useState<any>(null)

	const fetchStats = useCallback(() => {
		fetch("/api/stats/dashboard")
			.then((res) => res.json())
			.then((d) => {
				setData(d)
				setLoading(false)
			})
	}, [])

	const handleDelete = async (id: number) => {
		if (!confirm("Hapus transaksi ini?")) return
		try {
			const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
			if (!res.ok) throw new Error("Gagal menghapus")
			toast.success("Transaksi dihapus")
			setSelectedTx(null)
			fetchStats()
		} catch (err: any) {
			toast.error(err.message)
		}
	}

	useEffect(() => {
		fetchStats()
	}, [])

	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount)
	}

	return (
		<div className="p-4 pb-10 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-xl font-black italic bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
						Dompeto
					</h1>
					<p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
						Personal Finance
					</p>
				</div>
			</div>

			{/* Balance Card */}
			<Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 text-slate-100 shadow-premium overflow-hidden relative rounded-2xl">
				<div className="absolute top-0 right-0 p-4 opacity-5">
					<Wallet className="w-24 h-24 rotate-12" />
				</div>
				<CardHeader className="pb-1">
					<CardTitle className="text-[9px] font-bold opacity-50 uppercase tracking-[0.2em]">
						Total Saldo
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-xl font-black italic tracking-tight min-h-[28px]">
						{loading ? (
							<Skeleton className="h-7 w-32 bg-slate-800/40" />
						) : (
							formatIDR(data?.balance || 0)
						)}
					</div>
					<div className="mt-3 flex items-center gap-2 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 w-fit px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
						<ArrowUpRight className="w-2.5 h-2.5" />
						Terbarui Hari Ini
					</div>
				</CardContent>
			</Card>

			{/* Daily Metrics */}
			<div className="grid grid-cols-2 gap-3">
				<Card className="bg-slate-800/40 border border-white/10 shadow-premium rounded-2xl">
					<CardContent className="p-3.5 flex flex-col gap-3">
						<div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-widest">
							{data?.spentToday && data.spentToday < 0 ? (
								<TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
							) : (
								<TrendingDown className="w-2.5 h-2.5 text-red-400" />
							)}{" "}
							Hari Ini
						</div>
						<div
							className={cn(
								"text-sm font-black italic min-h-[20px]",
								data?.spentToday && data.spentToday < 0
									? "text-emerald-500/90"
									: "text-red-500/90",
							)}
						>
							{loading ? (
								<Skeleton className="h-5 w-24 bg-slate-800/40" />
							) : (
								<>
									{data?.spentToday && data.spentToday < 0 ? "+ " : ""}
									{formatIDR(Math.abs(data?.spentToday || 0))}
								</>
							)}
						</div>
					</CardContent>
				</Card>
				<Card className="bg-slate-800/40 border border-white/10 shadow-premium rounded-2xl">
					<CardContent className="p-4 flex flex-col gap-1">
						<div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-widest">
							Jumlah
						</div>
						<div className="text-lg font-black italic text-slate-100 flex items-center gap-2 min-h-[28px]">
							{loading ? (
								<Skeleton className="h-7 w-12 bg-slate-800/40" />
							) : (
								<>
									{data?.countToday || 0}
									<span className="text-[8px] font-bold text-slate-500 uppercase not-italic">
										kali
									</span>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Transactions */}
			<div className="space-y-4">
				<div className="flex justify-between items-center px-1">
					<h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
						<History className="w-4 h-4 text-emerald-500" /> Riwayat Terakhir
					</h2>
					<Button
						variant="link"
						className="text-[10px] font-bold text-emerald-500 h-auto p-0 uppercase tracking-widest"
						onClick={() => router.push("/transactions")}
					>
						Lainnya
					</Button>
				</div>

				<div className="space-y-3">
					{loading ? (
						[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-800/30" />
						))
					) : data?.latestTransactions?.length === 0 ? (
						<div className="bg-slate-900/20 border border-dashed border-white/5 rounded-2xl p-6 text-center">
							<p className="text-slate-500 text-[10px] font-bold italic">
								Belum ada catatan hari ini
							</p>
						</div>
					) : (
						data?.latestTransactions?.map((tx: any) => (
							<TransactionItem key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
						))
					)}
				</div>
			</div>

			{/* Floating Bottom Button */}
			<div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[220px] px-4">
				<AddTransactionModal onSuccess={fetchStats}>
					<Button className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-xs shadow-xl shadow-emerald-950/20 gap-3 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all">
						<Plus className="w-4 h-4" /> CATAT
					</Button>
				</AddTransactionModal>
			</div>

			<TransactionDetailDrawer
				transaction={selectedTx}
				onClose={() => setSelectedTx(null)}
				onDelete={handleDelete}
				onUpdate={fetchStats}
			/>
		</div>
	)
}
