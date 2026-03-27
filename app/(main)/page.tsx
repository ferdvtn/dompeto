"use client"

import { useEffect, useState } from "react"
import { Plus, Wallet, TrendingDown, ArrowUpRight, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { CategoryIcon } from "@/components/category-icon"

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

	const fetchStats = () => {
		fetch("/api/stats/dashboard")
			.then((res) => res.json())
			.then((d) => {
				setData(d)
				setLoading(false)
			})
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

	if (loading) {
		return (
			<div className="p-4 space-y-6">
				<Skeleton className="h-40 w-full rounded-3xl" />
				<div className="grid grid-cols-2 gap-4">
					<Skeleton className="h-24 rounded-3xl" />
					<Skeleton className="h-24 rounded-3xl" />
				</div>
				<Skeleton className="h-64 w-full rounded-3xl" />
			</div>
		)
	}

	return (
		<div className="p-4 pb-24 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-black italic bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
						Dompeto
					</h1>
					<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
						Personal Finance
					</p>
				</div>
			</div>

			{/* Balance Card */}
			<Card className="bg-slate-900/40 backdrop-blur-md border-white/5 text-slate-100 shadow-premium overflow-hidden relative rounded-[2rem]">
				<div className="absolute top-0 right-0 p-4 opacity-5">
					<Wallet className="w-24 h-24 rotate-12" />
				</div>
				<CardHeader className="pb-2">
					<CardTitle className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">
						Total Saldo
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-black italic tracking-tight">
						{formatIDR(data?.balance || 0)}
					</div>
					<div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 w-fit px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
						<ArrowUpRight className="w-3 h-3" />
						Terbarui Hari Ini
					</div>
				</CardContent>
			</Card>

			{/* Daily Metrics */}
			<div className="grid grid-cols-2 gap-4">
				<Card className="bg-slate-900/40 border-white/5 shadow-premium rounded-3xl">
					<CardContent className="p-4 flex flex-col gap-1">
						<div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
							<TrendingDown className="w-3 h-3 text-red-400" /> Pengeluaran Hari Ini
						</div>
						<div className="text-base font-black italic text-red-500/90">
							{formatIDR(data?.spentToday || 0)}
						</div>
					</CardContent>
				</Card>
				<Card className="bg-slate-900/40 border-white/5 shadow-premium rounded-3xl">
					<CardContent className="p-4 flex flex-col gap-1">
						<div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
							Jumlah
						</div>
						<div className="text-xl font-black italic text-slate-100">
							{data?.countToday || 0}
							<span className="text-[9px] font-bold text-slate-500 ml-3 uppercase not-italic">
								kali
							</span>
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
					{data?.latestTransactions?.length === 0 ? (
						<div className="bg-slate-900/20 border border-dashed border-white/5 rounded-3xl p-8 text-center">
							<p className="text-slate-500 text-xs font-bold italic">
								Belum ada catatan hari ini
							</p>
						</div>
					) : (
						data?.latestTransactions?.map((tx: any) => (
							<div
								key={tx.id}
								className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-[1.5rem] active:scale-[0.98] transition-transform shadow-premium"
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
											{new Date(tx.created_at).toLocaleTimeString("id", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</div>
									</div>
								</div>
								<div
									className={cn(
										"text-xs font-black italic",
										tx.type === "income" ? "text-emerald-400" : "text-red-400",
									)}
								>
									{tx.type === "income" ? "+" : "-"} {formatIDR(tx.amount)}
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Floating Bottom Button */}
			<div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[280px] px-4">
				<AddTransactionModal onSuccess={fetchStats}>
					<Button className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-sm shadow-xl shadow-emerald-950/20 gap-3 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all">
						<Plus className="w-5 h-5" /> CATAT
					</Button>
				</AddTransactionModal>
			</div>
		</div>
	)
}
