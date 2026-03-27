"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Transaction {
	id: number
	description: string
	amount: number
	type: "expense" | "income"
	category_id: number
	category_name?: string
}

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
	const [formData, setFormData] = useState<Partial<Transaction>>({})
	const [categories, setCategories] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (transaction) {
			setFormData(transaction)
		}
		// Load categories for the dropdown
		fetch("/api/categories")
			.then((res) => res.json())
			.then((data) => setCategories(data))
	}, [transaction])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!transaction) return
		setIsLoading(true)
		try {
			const res = await fetch(`/api/transactions/${transaction.id}`, {
				method: "PATCH",
				body: JSON.stringify(formData),
			})
			if (!res.ok) throw new Error("Gagal memperbarui")
			toast.success("Transaksi diperbarui")
			onSuccess()
			onClose()
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-gray-950 border-gray-800 sm:max-w-md mx-auto rounded-3xl">
				<DialogHeader>
					<DialogTitle className="text-xl font-black italic italic">
						Edit Transaksi
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 pt-4">
					<div className="space-y-2">
						<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
							Deskripsi
						</Label>
						<Input
							className="bg-gray-900 border-gray-800 rounded-xl"
							value={formData.description || ""}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
								Nominal
							</Label>
							<Input
								type="number"
								className="bg-gray-900 border-gray-800 rounded-xl"
								value={formData.amount || 0}
								onChange={(e) =>
									setFormData({ ...formData, amount: Number(e.target.value) })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
								Tipe
							</Label>
							<Select
								value={formData.type}
								onValueChange={(v: any) => setFormData({ ...formData, type: v })}
							>
								<SelectTrigger className="bg-gray-900 border-gray-800 rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-gray-900 border-gray-800">
									<SelectItem value="expense">Pengeluaran</SelectItem>
									<SelectItem value="income">Pemasukan</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
							Kategori
						</Label>
						<Select
							value={String(formData.category_id)}
							onValueChange={(v) =>
								setFormData({ ...formData, category_id: Number(v) })
							}
						>
							<SelectTrigger className="bg-gray-900 border-gray-800 rounded-xl">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="bg-gray-900 border-gray-800">
								{categories.map((c) => (
									<SelectItem key={c.id} value={String(c.id)}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-3 pt-6">
						<Button
							type="button"
							variant="ghost"
							className="flex-1 rounded-xl h-12"
							onClick={onClose}
						>
							Batal
						</Button>
						<Button
							type="submit"
							className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-xl h-12 font-bold"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
							) : (
								<Check className="w-4 h-4 mr-2" />
							)}{" "}
							Simpan
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
