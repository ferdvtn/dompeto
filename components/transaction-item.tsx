"use client"

import { CategoryIcon } from "@/components/category-icon"
import { cn } from "@/lib/utils"

interface TransactionItemProps {
	tx: any
	onClick?: () => void
}

export function TransactionItem({ tx, onClick }: TransactionItemProps) {
	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount)
	}

	return (
		<div
			className="group flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-2xl shadow-premium active:scale-[0.98] transition-all relative overflow-hidden cursor-pointer"
			onClick={onClick}
		>
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-inner border border-white/5">
					<CategoryIcon
						name={tx.category_icon || "Wallet"}
						className="w-5 h-5 text-emerald-500/80"
					/>
				</div>
				<div>
					<div className="text-xs font-bold text-slate-100 italic line-clamp-1">
						{tx.description || tx.raw_input}
					</div>
					<div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
						{tx.category_name} •{" "}
						{new Date(tx.created_at).toLocaleDateString("id", {
							day: "2-digit",
							month: "short",
						})}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<div
					className={cn(
						"text-xs font-black italic",
						tx.type === "income" ? "text-emerald-400" : "text-red-400",
					)}
				>
					{tx.type === "income" ? "+" : "-"} {formatIDR(tx.amount)}
				</div>
			</div>
		</div>
	)
}
