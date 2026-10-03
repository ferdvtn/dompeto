"use client"
import { CategoryIcon } from "@/components/category-icon"
import { type Transaction, formatIDR, dateLabel } from "@/lib/finance"
export function TransactionItem({
	tx,
	onClick,
}: {
	tx: Transaction
	onClick?: () => void
}) {
	return (
		<button className="transaction" onClick={onClick}>
			<span className="tx-icon">
				<CategoryIcon name={tx.category_icon || "Wallet"} size={20} />
			</span>
			<span>
				<span className="tx-description">{tx.description || tx.raw_input}</span>
				<span className="block text-xs muted mt-1">
					{tx.category_name} · {dateLabel(tx.date)}
				</span>
				{tx.type === "expense" && tx.include_in_budget === 0 && (
					<span className="text-xs muted">Di luar anggaran</span>
				)}
			</span>
			<span
				className={`tx-amount money ${tx.type === "income" ? "text-income" : "text-expense"}`}
			>
				{tx.type === "income" ? "+" : "−"}
				{formatIDR(tx.amount)}
			</span>
		</button>
	)
}
