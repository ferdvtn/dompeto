"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Wallet } from "lucide-react"
import { type Transaction, type Cycle, formatIDR } from "@/lib/finance"
import { useResource } from "@/lib/use-resource"
import {
	PageHeader,
	RecordAction,
	BudgetCard,
	LoadError,
} from "@/components/page-ui"
import { TransactionItem } from "@/components/transaction-item"
import { TransactionDetailDrawer } from "@/components/transaction-detail-drawer"
interface DashboardData {
	balance: number
	spentToday: number
	countToday: number
	latestTransactions: Transaction[]
	cycle: Cycle
}
export default function Dashboard() {
	const { data, error, reload } = useResource<DashboardData>(
		"/api/stats/dashboard",
	)
	const [selected, setSelected] = useState<Transaction | null>(null)
	return (
		<div className="page stack">
			<PageHeader title="Dompeto" subtitle="Ruang tenang untuk keuanganmu." />
			{error ? (
				<LoadError retry={reload} />
			) : !data ? (
				<div className="stack" aria-label="Memuat ringkasan">
					<div className="loading-card" />
					<div className="loading-card" />
				</div>
			) : (
				<div className="dashboard-grid">
					<div className="stack">
						<BudgetCard cycle={data.cycle} />
						<div className="metrics">
							{[
								["Pemasukan siklus", data.cycle.income, "text-income"],
								["Pengeluaran siklus", data.cycle.expense, "text-expense"],
							].map(([label, value, color]) => (
								<section key={label} className="card">
									<p className="muted text-xs">{label}</p>
									<strong className={`money ${color}`}>
										{formatIDR(Number(value))}
									</strong>
								</section>
							))}
						</div>
						<section className="card fields">
							<div className="row between">
								<span className="muted text-sm">Pengeluaran hari ini</span>
								<span className="money text-sm">
									{formatIDR(data.spentToday)}
								</span>
							</div>
							<div className="row between">
								<span className="row muted text-sm">
									<Wallet size={16} />
									Saldo keseluruhan
								</span>
								<span className="money text-sm">{formatIDR(data.balance)}</span>
							</div>
						</section>
					</div>
					<section className="stack">
						<div className="row between">
							<h2>Transaksi terbaru</h2>
							<Link
								className="row text-sm text-primary min-h-11"
								href="/transactions"
							>
								Lihat semua
								<ArrowUpRight size={16} />
							</Link>
						</div>
						{data.latestTransactions.length ? (
							<div className="transaction-list">
								{data.latestTransactions.map((tx) => (
									<TransactionItem
										key={tx.id}
										tx={tx}
										onClick={() => setSelected(tx)}
									/>
								))}
							</div>
						) : (
							<div className="card">
								<h2>Mulai dari satu catatan</h2>
								<p className="muted text-sm mt-2">
									Tekan Catat transaksi untuk mencatat pengeluaran atau gaji
									pertamamu.
								</p>
							</div>
						)}
					</section>
				</div>
			)}
			<RecordAction onSuccess={reload} />
			<TransactionDetailDrawer
				transaction={selected}
				onClose={() => setSelected(null)}
				onUpdate={reload}
			/>
		</div>
	)
}
