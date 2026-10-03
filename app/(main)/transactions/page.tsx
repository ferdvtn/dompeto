"use client"
import { useEffect, useRef, useState } from "react"
import { type Transaction, dateLabel } from "@/lib/finance"
import { api } from "@/lib/client-api"
import { PageHeader, RecordAction, LoadError } from "@/components/page-ui"
import { TransactionItem } from "@/components/transaction-item"
import { TransactionDetailDrawer } from "@/components/transaction-detail-drawer"
export default function TransactionsPage() {
	const [search, setSearch] = useState(""),
		[sort, setSort] = useState("desc"),
		[version, setVersion] = useState(0)
	return (
		<div className="page stack">
			<PageHeader
				title="Transaksi"
				subtitle="Setiap catatan, lebih mudah ditemukan."
			/>
			<div className="grid gap-3 md:grid-cols-[1fr_180px]">
				<label className="field">
					Cari transaksi
					<input
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Keterangan atau kategori"
					/>
				</label>
				<label className="field">
					Urutkan
					<select value={sort} onChange={(e) => setSort(e.target.value)}>
						<option value="desc">Terbaru</option>
						<option value="asc">Terlama</option>
					</select>
				</label>
			</div>
			<Results
				key={`${search}:${sort}:${version}`}
				search={search}
				sort={sort}
				reload={() => setVersion((v) => v + 1)}
			/>
			<RecordAction onSuccess={() => setVersion((v) => v + 1)} />
		</div>
	)
}
function Results({
	search,
	sort,
	reload,
}: {
	search: string
	sort: string
	reload: () => void
}) {
	const [rows, setRows] = useState<Transaction[]>([]),
		[more, setMore] = useState(false),
		[page, setPage] = useState(1),
		[loading, setLoading] = useState(true),
		[error, setError] = useState(false),
		[selected, setSelected] = useState<Transaction | null>(null)
	const pending = useRef(false)
	useEffect(() => {
		const controller = new AbortController()
		const timer = setTimeout(
			() => {
				api<{ data: Transaction[]; hasMore: boolean }>(
					`/api/transactions?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}`,
					{ signal: controller.signal },
				)
					.then((data) => {
						setRows((previous) => [
							...previous,
							...data.data.filter(
								(tx) => !previous.some((p) => p.id === tx.id),
							),
						])
						setMore(data.hasMore)
						setLoading(false)
						pending.current = false
					})
					.catch(() => {
						if (!controller.signal.aborted) {
							setError(true)
							setLoading(false)
							pending.current = false
						}
					})
			},
			search && page === 1 ? 300 : 0,
		)
		return () => {
			clearTimeout(timer)
			controller.abort()
		}
	}, [search, sort, page])
	return (
		<>
			<div className="transaction-list">
				{rows.map((tx, index) => {
					const date = tx.date.slice(0, 10),
						heading = date !== rows[index - 1]?.date.slice(0, 10)
					return (
						<div key={tx.id}>
							{heading && (
								<h2 className="text-sm muted mt-5 mb-3">{dateLabel(date)}</h2>
							)}
							<TransactionItem tx={tx} onClick={() => setSelected(tx)} />
						</div>
					)
				})}
			</div>
			{error ? (
				<LoadError retry={reload} />
			) : loading ? (
				<div className="loading-card" aria-label="Memuat transaksi" />
			) : !rows.length ? (
				<div className="card">
					<h2>{search ? "Tidak ada hasil" : "Belum ada transaksi"}</h2>
					<p className="muted mt-2">
						{search
							? `Coba kata lain untuk “${search}”, atau kosongkan pencarian.`
							: "Catat pengeluaran atau pemasukan pertamamu."}
					</p>
				</div>
			) : (
				more && (
					<button
						className="btn"
						onClick={() => {
							if (pending.current) return
							pending.current = true
							setLoading(true)
							setPage((p) => p + 1)
						}}
					>
						Muat lebih banyak
					</button>
				)
			)}
			<TransactionDetailDrawer
				transaction={selected}
				onClose={() => setSelected(null)}
				onUpdate={reload}
			/>
		</>
	)
}
