import Link from "next/link"
import { Settings, Plus } from "lucide-react"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { formatIDR, dateLabel, addDays, type Cycle } from "@/lib/finance"
export function PageHeader({
	title,
	subtitle,
}: {
	title: string
	subtitle?: string
}) {
	return (
		<header className="row between">
			<div>
				<h1>{title}</h1>
				{subtitle && <p className="muted text-sm mt-1">{subtitle}</p>}
			</div>
			<Link href="/settings" className="icon-btn" aria-label="Pengaturan">
				<Settings size={22} />
			</Link>
		</header>
	)
}
export function RecordAction({ onSuccess }: { onSuccess: () => void }) {
	return (
		<div className="record-action">
			<AddTransactionModal onSuccess={onSuccess}>
				<span className="btn primary">
					<Plus size={20} />
					Catat transaksi
				</span>
			</AddTransactionModal>
		</div>
	)
}
export function BudgetCard({
	cycle,
	historical = false,
}: {
	cycle: Cycle
	historical?: boolean
}) {
	return (
		<section className="card hero">
			<div className="row between">
				<p className="muted">{historical ? "Sisa akhir" : "Sisa anggaran"}</p>
				<span className="text-xs muted">Siklus gaji</span>
			</div>
			<p className="text-xs muted mt-2">
				{dateLabel(cycle.start)} – {dateLabel(addDays(cycle.end, -1))}
			</p>
			{cycle.budget > 0 ? (
				<>
					<p
						className={`amount money ${cycle.remaining < 0 ? "text-expense" : ""}`}
					>
						{formatIDR(cycle.remaining)}
					</p>
					<div
						className="progress"
						role="progressbar"
						aria-label="Anggaran terpakai"
						aria-valuenow={Math.round(100 - cycle.percent)}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<span
							style={{
								width: `${100 - cycle.percent}%`,
								background: cycle.remaining < 0 ? "var(--expense)" : undefined,
							}}
						/>
					</div>
					<div className="row between mt-3 text-xs muted">
						<span>Terpakai {formatIDR(cycle.spent)}</span>
						<span>Dari {formatIDR(cycle.budget)}</span>
					</div>
					<p className="text-sm mt-5">
						{cycle.remaining < 0
							? `Melebihi anggaran ${formatIDR(-cycle.remaining)}`
							: historical
								? "Ringkasan siklus terpilih"
								: `${cycle.daysLeft} hari menuju siklus berikutnya`}
					</p>
				</>
			) : (
				<div className="mt-5">
					<h2>Mulai dengan batas belanja</h2>
					<p className="muted text-sm my-3">
						Atur anggaran agar sisa belanja lebih mudah dipantau.
					</p>
					<Link className="btn primary" href="/settings">
						Atur anggaran
					</Link>
				</div>
			)}
			<p className="muted text-xs mt-4">
				Pemasukan tidak menambah batas anggaran.
			</p>
		</section>
	)
}
export function LoadError({ retry }: { retry: () => void }) {
	return (
		<div className="card stack" role="alert">
			<p>Data belum berhasil dimuat.</p>
			<button className="btn" onClick={retry}>
				Coba lagi
			</button>
		</div>
	)
}
