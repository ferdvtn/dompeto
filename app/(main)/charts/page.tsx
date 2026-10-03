"use client"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { type Cycle, formatIDR, dateLabel } from "@/lib/finance"
import { useResource } from "@/lib/use-resource"
import { PageHeader, BudgetCard, LoadError } from "@/components/page-ui"
type ChartData = {
	cycle: Cycle
	categories: { name: string; value: number }[]
	daily: {
		date: string
		amount: number
		regularAmount: number
		excludedAmount: number
	}[]
}
export default function ChartsPage() {
	const [offset, setOffset] = useState(0)
	const { data, error, reload } = useResource<ChartData>(
		`/api/stats/charts?offset=${offset}`,
	)
	return (
		<div className="page stack">
			<PageHeader
				title="Grafik"
				subtitle="Kenali kebiasaan, jaga ruang untuk kebutuhanmu."
			/>
			<div className="row between">
				<button
					className="btn"
					aria-label="Siklus sebelumnya"
					onClick={() => setOffset((o) => o - 1)}
				>
					<ChevronLeft size={20} />
				</button>
				<p className="text-sm">
					{offset === 0 ? "Siklus saat ini" : "Siklus sebelumnya"}
				</p>
				<button
					className="btn"
					aria-label="Siklus berikutnya"
					disabled={offset >= 0}
					onClick={() => setOffset((o) => o + 1)}
				>
					<ChevronRight size={20} />
				</button>
			</div>
			{error ? (
				<LoadError retry={reload} />
			) : !data ? (
				<div className="loading-card" aria-label="Memuat grafik" />
			) : (
				<>
					<div className="dashboard-grid">
						<BudgetCard cycle={data.cycle} historical={offset !== 0} />
						<section className="card stack">
							<div>
								<h2>Pengeluaran per kategori</h2>
								<p className="muted text-sm mt-1">
									Semua pengeluaran dalam siklus terpilih
								</p>
							</div>
							{data.categories.length ? (
								data.categories.map((c) => (
									<div key={c.name}>
										<div className="row between text-sm mb-2">
											<span>{c.name || "Lainnya"}</span>
											<span className="money">{formatIDR(c.value)}</span>
										</div>
										<div className="progress">
											<span
												style={{
													width: `${data.cycle.expense ? (c.value / data.cycle.expense) * 100 : 0}%`,
												}}
											/>
										</div>
										<p className="muted text-xs mt-1">
											{data.cycle.expense
												? Math.round((c.value / data.cycle.expense) * 100)
												: 0}
											% dari pengeluaran
										</p>
									</div>
								))
							) : (
								<p className="muted">Belum ada pengeluaran pada siklus ini.</p>
							)}
						</section>
					</div>
					<section className="card stack">
						<div>
							<h2>7 hari terakhir</h2>
							<p className="muted text-sm mt-1">
								Pengeluaran harian, terpisah dari pemilih siklus di atas.
							</p>
						</div>
						<div className="flex items-end gap-2 h-36" aria-hidden="true">
							{data.daily.map((day) => (
								<div
									key={day.date}
									className="flex-1 flex flex-col justify-end h-full"
								>
									<div
										className="rounded-t-md bg-primary"
										style={{
											height: `${Math.max(2, (day.amount / Math.max(1, ...data.daily.map((d) => d.amount))) * 100)}%`,
										}}
									/>
								</div>
							))}
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="muted">
									<tr>
										<th className="py-3 font-normal">Tanggal</th>
										<th className="text-right font-normal">Masuk anggaran</th>
										<th className="text-right font-normal">Di luar anggaran</th>
									</tr>
								</thead>
								<tbody>
									{data.daily.map((day) => (
										<tr key={day.date} className="border-t">
											<td className="py-3 pr-2">{dateLabel(day.date)}</td>
											<td className="text-right money">
												{formatIDR(day.regularAmount)}
											</td>
											<td className="text-right money">
												{formatIDR(day.excludedAmount)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				</>
			)}
		</div>
	)
}
