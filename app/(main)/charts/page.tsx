"use client"

import { useEffect, useState } from "react"
import {
	PieChart as RePie,
	Pie,
	Cell,
	ResponsiveContainer,
	LineChart as ReLine,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	BarChart as ReBar,
	Bar,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, PieChart as PieIcon, Calendar, Target } from "lucide-react"

const COLORS = [
	"#10b981",
	"#3b82f6",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
]

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
				<Skeleton className="h-64 w-full rounded-3xl" />
				<Skeleton className="h-48 w-full rounded-3xl" />
				<Skeleton className="h-48 w-full rounded-3xl" />
			</div>
		)
	}

	const cyclePercentage = Math.min(
		Math.round((data.cycle.spent / data.cycle.budget) * 100),
		100,
	)

	return (
		<div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
			<h1 className="text-2xl font-black italic">Analitik & Grafik</h1>

			{/* Salary Cycle Tracker */}
			<Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden relative border-l-4 border-l-emerald-500">
				<CardHeader className="pb-2">
					<CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<Calendar className="w-3 h-3 text-emerald-400" /> Siklus Gaji (Sejak tgl
						25)
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex justify-between items-end">
						<div>
							<div className="text-2xl font-black italic text-gray-100">
								{formatIDR(data.cycle.spent)}
							</div>
							<div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
								Terpakai dari {formatIDR(data.cycle.budget)}
							</div>
						</div>
						<div className="text-right">
							<div className="text-lg font-black text-emerald-400 italic">
								{cyclePercentage}%
							</div>
						</div>
					</div>
					<Progress value={cyclePercentage} className="h-3 bg-gray-800" />
					<p className="text-[10px] text-gray-500 italic">
						Sisa anggaran:{" "}
						<span className="text-emerald-400 font-bold">
							{formatIDR(data.cycle.budget - data.cycle.spent)}
						</span>
					</p>
				</CardContent>
			</Card>

			{/* Pie Chart: Category Breakdown */}
			<Card className="bg-gray-900 border-gray-800 shadow-xl">
				<CardHeader className="pb-0">
					<CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<PieIcon className="w-3 h-3 text-cyan-400" /> Breakdown Kategori
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4 h-[320px]">
					<ResponsiveContainer width="100%" height={240}>
						<RePie>
							<Pie
								data={data.pieData}
								innerRadius={50}
								outerRadius={80}
								paddingAngle={5}
								dataKey="value"
								nameKey="name"
							>
								{data.pieData.map((entry: any, index: number) => (
									<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
								))}
							</Pie>
							<Tooltip
								contentStyle={{
									backgroundColor: "#111827",
									border: "1px solid #1f2937",
									borderRadius: "12px",
									fontSize: "12px",
								}}
								itemStyle={{ color: "#fff" }}
								formatter={(val: any) => formatIDR(Number(val) || 0)}
							/>
						</RePie>
					</ResponsiveContainer>
					<div className="flex flex-wrap gap-2 justify-center mt-2 px-2">
						{data.pieData.map((entry: any, index: number) => (
							<div key={entry.name} className="flex items-center gap-1.5">
								<div
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: COLORS[index % COLORS.length] }}
								/>
								<span className="text-[9px] font-bold text-gray-400 uppercase">
									{entry.name}
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Line Chart: Daily Trend */}
			<Card className="bg-gray-900 border-gray-800 shadow-xl">
				<CardHeader className="pb-0">
					<CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<TrendingUp className="w-3 h-3 text-emerald-400" /> Tren Pengeluaran (14
						Hari)
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-6 h-[220px]">
					<ResponsiveContainer width="100%" height={180}>
						<ReLine data={data.lineData}>
							<CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
							<XAxis
								dataKey="date"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#4b5563", fontSize: 10 }}
								tickFormatter={(v) => v.split("-").slice(1).reverse().join("/")}
							/>
							<YAxis hide />
							<Tooltip
								contentStyle={{
									backgroundColor: "#111827",
									border: "1px solid #1f2937",
									borderRadius: "12px",
									fontSize: "12px",
								}}
								itemStyle={{ color: "#fff" }}
								formatter={(val: any) => formatIDR(Number(val) || 0)}
							/>
							<Line
								type="monotone"
								dataKey="amount"
								stroke="#10b981"
								strokeWidth={3}
								dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#111827" }}
								activeDot={{ r: 6 }}
							/>
						</ReLine>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Bar Chart: Spending Comparison */}
			<Card className="bg-gray-900 border-gray-800 shadow-xl">
				<CardHeader className="pb-0">
					<CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<Target className="w-3 h-3 text-amber-400" /> Perbandingan Per Kategori
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-6 h-[220px]">
					<ResponsiveContainer width="100%" height={180}>
						<ReBar data={data.pieData}>
							<XAxis
								dataKey="name"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#4b5563", fontSize: 9 }}
							/>
							<YAxis hide />
							<Tooltip
								contentStyle={{
									backgroundColor: "#111827",
									border: "1px solid #1f2937",
									borderRadius: "12px",
									fontSize: "12px",
								}}
								formatter={(val: any) => formatIDR(Number(val) || 0)}
							/>
							<Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
						</ReBar>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</div>
	)
}
