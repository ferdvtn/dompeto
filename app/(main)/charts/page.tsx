"use client"

import { useEffect, useState } from "react"
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	CartesianGrid,
	BarChart,
	Bar,
	LabelList,
} from "recharts"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Wallet, Calendar, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function ChartsPage() {
	const [data, setData] = useState<any>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetch("/api/stats/charts")
			.then((res) => res.json())
			.then((d) => {
				setData(d)
				setLoading(false)
			})
	}, [])

	const formatIDR = (val: number) => {
		return "Rp " + new Intl.NumberFormat("id-ID").format(val)
	}

	if (loading) {
		return (
			<div className="p-4 space-y-6">
				<Skeleton className="h-64 w-full rounded-[2rem] bg-slate-900/50" />
				<Skeleton className="h-64 w-full rounded-[2rem] bg-slate-900/50" />
				<Skeleton className="h-64 w-full rounded-[2rem] bg-slate-900/50" />
			</div>
		)
	}

	return (
		<div className="p-4 pb-24 space-y-6">
			<h1 className="text-2xl font-black italic text-slate-100">Analitik</h1>

			{/* Salary Cycle Info */}
			<Card
				className={cn(
					"shadow-2xl rounded-[2rem] overflow-hidden backdrop-blur-md border",
					data.cycle.spent > data.cycle.budget
						? "bg-red-600/20 border-red-500/20 text-red-100 shadow-red-950/20"
						: "bg-emerald-600/20 border-emerald-500/20 text-emerald-100 shadow-emerald-950/20",
				)}
			>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
							Siklus Gaji ini
						</CardTitle>
						{data.cycle.spent > data.cycle.budget ? (
							<AlertTriangle className="w-4 h-4 text-red-400" />
						) : (
							<Calendar className="w-4 h-4 opacity-50 text-emerald-400" />
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div
						className={cn(
							"text-xl font-black italic mb-4",
							data.cycle.spent > data.cycle.budget
								? "text-red-300"
								: "text-emerald-300",
						)}
					>
						{data.cycle.daysLeft} Hari Lagi
					</div>
					<div className="space-y-4">
						<div className="flex justify-between items-center text-[10px] font-bold uppercase">
							<span
								className={data.cycle.spent > data.cycle.budget ? "text-red-300" : ""}
							>
								{data.cycle.spent > data.cycle.budget
									? "Anggaran Terlampaui"
									: "Sisa Anggaran"}
							</span>
							{data.cycle.spent <= data.cycle.budget && (
								<span>{Math.round(data.cycle.percent)}%</span>
							)}
						</div>

						{data.cycle.spent <= data.cycle.budget && (
							<div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
								<div
									className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
									style={{ width: `${data.cycle.percent}%` }}
								/>
							</div>
						)}

						<div className="flex justify-between text-[11px] font-black italic pt-1">
							<div className="flex flex-col">
								<span className="text-[8px] opacity-40 uppercase not-italic mb-0.5">
									Terpakai
								</span>
								<span>{formatIDR(data.cycle.spent)}</span>
							</div>
							<div className="flex flex-col text-right">
								<span className="text-[8px] opacity-40 uppercase not-italic mb-0.5">
									Limit
								</span>
								<span>{formatIDR(data.cycle.budget)}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Category Pie Chart */}
			<Card className="bg-slate-900/40 border-white/5 shadow-premium rounded-[2rem] backdrop-blur-md">
				<CardHeader>
					<div className="flex items-center gap-2 text-emerald-400">
						<TrendingUp className="w-5 h-5" />
						<CardTitle className="text-lg font-black italic text-slate-100">
							Alokasi Dana
						</CardTitle>
					</div>
					<CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
						Distribusi pengeluaran bulan ini
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="h-64 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={data.categories}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={80}
									paddingAngle={5}
									dataKey="value"
									labelLine={false}
								>
									{data.categories.map((_: any, index: number) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
											stroke="transparent"
										/>
									))}
									<LabelList
										dataKey="name"
										position="outside"
										style={{ fontSize: "9px", fontWeight: "bold", fill: "#64748b" }}
										formatter={(val: any) => String(val || "").split(" ")[0]}
									/>
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: "#0f172a",
										borderRadius: "16px",
										border: "1px solid rgba(255,255,255,0.05)",
										boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
										fontSize: "12px",
										fontWeight: "bold",
										fontStyle: "italic",
									}}
									itemStyle={{ color: "#f1f5f9" }}
									formatter={(val: any) => [formatIDR(Number(val || 0)), "Nilai"]}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="grid grid-cols-2 gap-2 mt-4 px-2">
						{data.categories.slice(0, 4).map((cat: any, i: number) => (
							<div key={cat.name} className="flex items-center gap-2">
								<div
									className="w-2 rounded-full h-2"
									style={{ backgroundColor: COLORS[i % COLORS.length] }}
								/>
								<span className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">
									{cat.name}
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Daily Spending Line Chart */}
			<Card className="bg-slate-900/40 border-white/5 shadow-premium rounded-[2rem] backdrop-blur-md">
				<CardHeader>
					<div className="text-cyan-400 flex items-center gap-2 mb-1">
						<TrendingUp className="w-5 h-5" />
						<CardTitle className="text-lg font-black italic text-slate-100">
							Tren Harian
						</CardTitle>
					</div>
					<CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
						Pengeluaran 7 hari terakhir
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-64 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={data.daily}
								margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
							>
								<XAxis
									dataKey="date"
									axisLine={false}
									tickLine={false}
									tick={{ fill: "#64748b", fontSize: 9, fontWeight: "bold" }}
									className="uppercase tracking-widest"
									tickFormatter={(val: any) =>
										String(val || "")
											.split("-")
											.slice(1, 3)
											.join("/")
									}
								/>
								<YAxis hide />
								<Tooltip
									cursor={{ fill: "rgba(255,255,255,0.03)" }}
									contentStyle={{
										backgroundColor: "#0f172a",
										borderRadius: "16px",
										border: "1px solid rgba(255,255,255,0.05)",
										boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
										fontSize: "12px",
										fontWeight: "bold",
										fontStyle: "italic",
									}}
									itemStyle={{ color: "#22d3ee" }}
									formatter={(val: any) => [formatIDR(Number(val || 0)), "Keluar"]}
								/>
								<Bar
									dataKey="amount"
									fill="url(#barGradient)"
									radius={[8, 8, 0, 0]}
									barSize={28}
								>
									<LabelList
										dataKey="amount"
										position="top"
										style={{
											fontSize: "8px",
											fontWeight: "900",
											fill: "#06b6d4",
											fontStyle: "italic",
										}}
										formatter={(val: any) =>
											Number(val || 0) > 0 ? `${Math.round(Number(val) / 1000)}k` : ""
										}
									/>
								</Bar>
								<defs>
									<linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#06b6d4" />
										<stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
									</linearGradient>
								</defs>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
