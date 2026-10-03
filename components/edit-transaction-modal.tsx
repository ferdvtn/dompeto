"use client"
import { TransactionDetailDrawer } from "@/components/transaction-detail-drawer"
import { type Transaction } from "@/lib/finance"
/** Compatibility wrapper. All transaction changes use the shared editor. */
export function EditTransactionModal({
	transaction,
	isOpen,
	onClose,
	onSuccess,
}: {
	transaction: Transaction | null
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
}) {
	return (
		<TransactionDetailDrawer
			transaction={isOpen ? transaction : null}
			onClose={onClose}
			onUpdate={onSuccess}
		/>
	)
}
