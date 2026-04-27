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
	ReferenceLine,
} from "recharts"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Wallet, Calendar, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { CategoryIcon } from "@/components/category-icon"

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function ChartsPage() {
	const [data, setData] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [cycleOffset, setCycleOffset] = useState(0)

	useEffect(() => {
		setLoading(true)
		fetch(`/api/stats/charts?offset=${cycleOffset}`)
			.then((res) => res.json())
			.then((d) => {
				setData(d)
				setLoading(false)
			})
	}, [cycleOffset])

	const handlePrevCycle = () => setCycleOffset((prev) => prev - 1)
	const handleNextCycle = () => setCycleOffset((prev) => prev + 1)

	const formatDateRange = (startStr: string, endStr: string) => {
		if (!startStr || !endStr) return ""
		const start = new Date(startStr)
		const end = new Date(endStr)
		end.setDate(end.getDate() - 1)
		const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
		return `${start.toLocaleDateString("id-ID", options)} - ${end.toLocaleDateString("id-ID", options)}`
	}

	const formatIDR = (val: number) => {
		return "Rp " + new Intl.NumberFormat("id-ID").format(val)
	}

	const averageExpense =
		data?.daily?.length > 0
			? data.daily.reduce((sum: number, item: any) => sum + item.regularAmount, 0) /
				data.daily.length
			: 0

	const remainingBudget = (data?.cycle?.budget || 0) - (data?.cycle?.spent || 0)
	const recommendedDaily =
		data?.cycle?.daysLeft > 0
			? Math.max(0, Math.round(remainingBudget / data.cycle.daysLeft))
			: Math.max(0, remainingBudget)

	const isOverBudget = !loading && data?.cycle?.spent > data?.cycle?.budget
	const remainingPercent = data?.cycle?.percent || 0

	return (
		<div className="p-4 pb-32 space-y-6 relative">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-black italic text-slate-100">Analitik</h1>
			</div>


			{/* Salary Cycle Info */}
			<Card
				className={cn(
					"shadow-2xl rounded-[2rem] overflow-hidden backdrop-blur-md border border-white/10",
					isOverBudget
						? "bg-red-600/20 border-red-500/20 text-red-100 shadow-red-950/20"
						: "bg-emerald-600/20 border-emerald-500/20 text-emerald-100 shadow-emerald-950/20",
				)}
			>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
							Siklus Gaji ini
						</CardTitle>
						{loading ? (
							<Skeleton className="w-4 h-4 rounded-full bg-white/10" />
						) : !loading && data?.cycle?.spent > data?.cycle?.budget ? (
							<AlertTriangle className="w-4 h-4 text-red-400" />
						) : (
							<Calendar className="w-4 h-4 opacity-50 text-emerald-400" />
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div
						className={cn(
							"text-xl font-black italic mb-4 min-h-[28px]",
							isOverBudget ? "text-red-300" : "text-emerald-300",
						)}
					>
						{loading ? (
							<Skeleton className="h-7 w-24 bg-white/10" />
						) : cycleOffset < 0 ? (
							"Siklus Selesai"
						) : (
							<>{data?.cycle?.daysLeft} Hari Lagi</>
						)}
					</div>
					<div className="space-y-4">
						<div className="flex justify-between items-center text-[10px] font-bold uppercase min-h-[15px]">
							<span
								className={
									!loading && data?.cycle?.spent > data?.cycle?.budget
										? "text-red-300"
										: ""
								}
							>
								{loading ? (
									<Skeleton className="h-3 w-20 bg-white/10" />
								) : !loading && data?.cycle?.spent > data?.cycle?.budget ? (
									"Anggaran Terlampaui"
								) : cycleOffset < 0 ? (
									"Sisa Akhir"
								) : (
									"Sisa Anggaran"
								)}
							</span>
							{!loading && data?.cycle?.spent <= data?.cycle?.budget && (
								<span>{Math.round(data?.cycle?.percent || 0)}%</span>
							)}
						</div>

						{loading ? (
							<Skeleton className="h-3 w-full rounded-full bg-white/10" />
						) : (
							!loading &&
							data?.cycle?.spent <= data?.cycle?.budget && (
								<div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
									<div
										className={cn(
											"h-full transition-all duration-1000",
											remainingPercent > 30
												? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
												: remainingPercent > 10
													? "bg-amber-500 shadow-amber-500/50"
													: "bg-red-500 shadow-red-500/50",
										)}
										style={{ width: `${remainingPercent}%` }}
									/>
								</div>
							)
						)}

						<div className="flex justify-between text-[11px] font-black italic pt-1">
							<div className="flex flex-col gap-1">
								<span className="text-[8px] opacity-40 uppercase not-italic">
									Sisa anggaran
								</span>
								{loading ? (
									<Skeleton className="h-4 w-20 bg-white/10" />
								) : (
									<span>
										{formatIDR((data?.cycle?.budget || 0) - (data?.cycle?.spent || 0))}
									</span>
								)}
							</div>
							<div className="flex flex-col text-right gap-1">
								<span className="text-[8px] opacity-40 uppercase not-italic">
									Limit
								</span>
								{loading ? (
									<Skeleton className="h-4 w-20 bg-white/10 ml-auto" />
								) : (
									<span>{formatIDR(data?.cycle?.budget || 0)}</span>
								)}
							</div>
						</div>

						{/* Recommended Daily Spend */}
						{!loading && data?.cycle?.budget > 0 && cycleOffset === 0 && (
							<div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<Wallet className="w-3 h-3 opacity-40" />
									<span className="text-[8px] font-bold uppercase tracking-wider opacity-40">
										Rekomendasi harian
									</span>
								</div>
								<span className="text-[11px] font-black italic text-emerald-300">
									{formatIDR(recommendedDaily)}
								</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Category Pie Chart */}
			<Card className="bg-slate-800/40 border border-white/10 shadow-premium rounded-[2rem] backdrop-blur-md">
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
					<div className="h-64 w-full flex items-center justify-center">
						{loading ? (
							<Skeleton className="w-40 h-40 rounded-full bg-slate-800/20" />
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data?.categories || []}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={80}
										paddingAngle={5}
										dataKey="value"
										labelLine={false}
									>
										{(data?.categories || []).map((_: any, index: number) => (
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
						)}
					</div>
					<div className="grid grid-cols-2 gap-2 mt-4 px-2">
						{loading
							? [...Array(4)].map((_, i) => (
									<Skeleton key={i} className="h-3 w-20 bg-slate-800/20 rounded" />
								))
							: (data?.categories || []).slice(0, 4).map((cat: any, i: number) => (
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
			{cycleOffset === 0 && (
			<Card className="bg-slate-800/40 border border-white/10 shadow-premium rounded-[2rem] backdrop-blur-md">
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
					<div className="h-64 w-full flex items-end gap-2 pb-4">
						{loading ? (
							[...Array(7)].map((_, i) => (
								<Skeleton
									key={i}
									className="flex-1 bg-slate-800/20 rounded-t-lg"
									style={{ height: `${20 + i * 10}%` }}
								/>
							))
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={data?.daily || []}
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
										content={({ active, payload, label }) => {
											if (active && payload && payload.length) {
												const data = payload[0].payload
												const regularBreakdown = data.breakdown.filter((b: any) => !b.isExcluded)
												const excludedBreakdown = data.breakdown.filter((b: any) => b.isExcluded)
												const date = new Date(label || "")
												const dateStr = date.toLocaleDateString("id-ID", { 
													day: "numeric", 
													month: "short", 
													year: "numeric" 
												})

												return (
													<div className="bg-slate-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl min-w-[180px]">
														<div className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">
															{dateStr}
														</div>
														<div className="flex flex-col gap-3">
															<div className="flex flex-col">
																<span className="text-[9px] font-bold text-cyan-400 uppercase tracking-tighter">
																	Pengeluaran Rutin
																</span>
																<span className="text-sm font-black italic text-slate-100">
																	{formatIDR(data.regularAmount)}
																</span>
															</div>

															{regularBreakdown.length > 0 && (
																<div className="space-y-1.5 pt-2 border-t border-white/5">
																	{regularBreakdown.map((item: any, idx: number) => (
																		<div key={idx} className="flex items-center justify-between gap-4">
																			<div className="flex items-center gap-1.5">
																				<CategoryIcon name={item.icon} className="w-3 h-3 text-slate-400" />
																				<span className="text-[10px] font-bold text-slate-400 italic">
																					{item.name}
																				</span>
																			</div>
																			<span className="text-[10px] font-black text-slate-300">
																				{formatIDR(item.amount)}
																			</span>
																		</div>
																	))}
																</div>
															)}

															{data.excludedAmount > 0 && (
																<div className="pt-2 border-t border-white/10 mt-1">
																	<div className="flex flex-col opacity-40">
																		<span className="text-[8px] font-bold uppercase tracking-tighter">
																			Invest & Tagihan (Excluded)
																		</span>
																		<span className="text-[11px] font-black italic">
																			{formatIDR(data.excludedAmount)}
																		</span>
																	</div>
																</div>
															)}
														</div>
													</div>
												)
											}
											return null
										}}
									/>
									<Bar
										dataKey="regularAmount"
										fill="url(#barGradient)"
										radius={[8, 8, 0, 0]}
										barSize={28}
									>
										<LabelList
											dataKey="regularAmount"
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
									{averageExpense > 0 && (
										<ReferenceLine
											y={averageExpense}
											stroke="#f59e0b"
											strokeDasharray="3 3"
											strokeWidth={2}
											label={{
												value: `${Math.round(averageExpense / 1000)}k`,
												position: "insideTopRight",
												dx: -10,
												dy: -15,
												fill: "#f59e0b",
												fontSize: 10,
												fontWeight: "bold",
												fontStyle: "italic",
											}}
										/>
									)}
									<defs>
										<linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="#06b6d4" />
											<stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
										</linearGradient>
									</defs>
								</BarChart>
							</ResponsiveContainer>
						)}
					</div>
				</CardContent>
			</Card>
			)}

			{/* Top 3 Transactions (Past Cycles) */}
			{cycleOffset < 0 && (
				<div className="space-y-4 pt-2">
					<div className="flex items-center gap-2 text-amber-400 px-1">
						<Trophy className="w-5 h-5" />
						<h2 className="text-[11px] font-black uppercase tracking-[0.1em]">
							Pengeluaran Terbesar
						</h2>
					</div>
					<div className="space-y-3">
						{loading ? (
							[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-800/30" />
							))
						) : data?.categories?.length === 0 ? (
							<div className="bg-slate-900/20 border border-dashed border-white/5 rounded-2xl p-6 text-center">
								<p className="text-slate-500 text-[10px] font-bold italic">
									Tidak ada data pengeluaran
								</p>
							</div>
						) : (
							data?.categories?.slice(0, 3).map((cat: any, index: number) => (
								<div
									key={cat.name}
									className="group flex items-center justify-between p-3 bg-slate-800/40 border border-white/10 rounded-2xl shadow-premium relative overflow-hidden"
								>
									<div className="flex items-center gap-3 min-w-0 flex-1">
										<div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-inner border border-white/5 shrink-0">
											<CategoryIcon
												name={cat.icon || "Wallet"}
												className="w-5 h-5 text-emerald-500/80"
											/>
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-xs font-bold text-slate-100 italic line-clamp-1">
												{cat.name}
											</div>
											<div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
												Top {index + 1}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-3 shrink-0 ml-4">
										<div className="text-xs font-black italic text-red-400">
											- {formatIDR(cat.value)}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* Floating Bottom Navigation */}
			<div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[320px] px-4 z-50">
				<div className="flex items-center justify-between bg-slate-900/90 border border-white/10 rounded-full p-2 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] shadow-premium">
					<button
						onClick={handlePrevCycle}
						disabled={cycleOffset <= -1}
						className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:active:scale-100"
					>
						<ChevronLeft className="w-5 h-5" />
					</button>

					<div className="flex flex-col items-center justify-center pointer-events-none">
						<div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
							<CalendarDays className="w-3.5 h-3.5" />
							<span className="text-[9px] font-black uppercase tracking-[0.2em]">
								Siklus
							</span>
						</div>
						<span className="text-[11px] font-bold text-slate-200">
							{loading ? (
								<Skeleton className="h-4 w-28 bg-white/10" />
							) : data?.cycle?.start && data?.cycle?.end ? (
								formatDateRange(data.cycle.start, data.cycle.end)
							) : (
								"Memuat..."
							)}
						</span>
					</div>

					<button
						onClick={handleNextCycle}
						disabled={cycleOffset >= 0}
						className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:active:scale-100"
					>
						<ChevronRight className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	)
}
