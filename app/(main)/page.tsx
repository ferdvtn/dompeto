"use client"

import { useEffect, useState } from "react"
import { Plus, Wallet, TrendingDown, ArrowUpRight, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DashboardData {
	balance: number
	spentToday: number
	countToday: number
	latestTransactions: any[]
}

import { useRouter } from "next/navigation"
import { AddTransactionModal } from "@/components/add-transaction-modal"

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
				<Skeleton className="h-40 w-full rounded-2xl" />
				<div className="grid grid-cols-2 gap-4">
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
				</div>
				<Skeleton className="h-64 w-full rounded-2xl" />
			</div>
		)
	}

	return (
		<div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
						Dompeto
					</h1>
					<p className="text-xs text-gray-400">Selamat datang kembali!</p>
				</div>
				<Button
					size="icon"
					variant="ghost"
					className="rounded-full bg-gray-900 border border-gray-800"
				>
					<Plus className="w-5 h-5 text-emerald-400" />
				</Button>
			</div>

			{/* Balance Card */}
			<Card className="bg-emerald-600 border-none text-white shadow-lg shadow-emerald-900/20 overflow-hidden relative">
				<div className="absolute top-0 right-0 p-4 opacity-20">
					<Wallet className="w-24 h-24 rotate-12" />
				</div>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">
						Saldo Sekarang
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold tracking-tight">
						{formatIDR(data?.balance || 0)}
					</div>
					<div className="mt-4 flex items-center gap-2 text-xs bg-white/10 w-fit px-2 py-1 rounded-full backdrop-blur-md">
						<ArrowUpRight className="w-3 h-3" />
						Terakhir diperbarui hari ini
					</div>
				</CardContent>
			</Card>

			{/* Daily Metrics */}
			<div className="grid grid-cols-2 gap-4">
				<Card className="bg-gray-900 border-gray-800">
					<CardContent className="p-4 flex flex-col gap-1">
						<div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
							<TrendingDown className="w-3 h-3 text-red-400" /> Pengeluaran Hari Ini
						</div>
						<div className="text-lg font-bold text-red-100">
							{formatIDR(data?.spentToday || 0)}
						</div>
					</CardContent>
				</Card>
				<Card className="bg-gray-900 border-gray-800">
					<CardHeader className="p-4 pb-0">
						<CardTitle className="text-xs text-gray-400 font-medium uppercase tracking-tighter">
							Transaksi
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-1">
						<div className="text-2xl font-bold text-gray-100">
							{data?.countToday || 0}
							<span className="text-xs font-normal text-gray-500 ml-1">kali</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Transactions */}
			<div className="space-y-4">
				<div className="flex justify-between items-center px-1">
					<h2 className="text-sm font-semibold flex items-center gap-2">
						<History className="w-4 h-4 text-emerald-400" /> Transaksi Terakhir
					</h2>
					<Button
						variant="link"
						className="text-xs text-emerald-400 h-auto p-0"
						onClick={() => router.push("/transactions")}
					>
						Lihat Semua
					</Button>
				</div>

				<div className="space-y-3">
					{data?.latestTransactions?.length === 0 ? (
						<div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-8 text-center">
							<p className="text-gray-500 text-sm italic">Belum ada transaksi</p>
						</div>
					) : (
						data?.latestTransactions?.map((tx: any) => (
							<div
								key={tx.id}
								className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-2xl active:scale-[0.98] transition-transform"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl">
										{/* Simple emoji fallback since we don't have icon mapping yet */}
										{tx.type === "income" ? "💰" : "🍕"}
									</div>
									<div>
										<div className="text-sm font-semibold text-gray-100 line-clamp-1">
											{tx.description || tx.raw_input}
										</div>
										<div className="text-[10px] text-gray-500">
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
										"text-sm font-bold",
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
			<div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
				<AddTransactionModal onSuccess={fetchStats}>
					<Button className="w-full h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2">
						<Plus className="w-5 h-5" /> Catat Transaksi
					</Button>
				</AddTransactionModal>
			</div>
		</div>
	)
}
