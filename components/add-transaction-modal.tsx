"use client"

import { useState } from "react"
import { Sparkles, X, Check, Loader2, AlertCircle } from "lucide-react"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ParsedData {
	amount: number
	type: "expense" | "income"
	category: string
	description: string
	notes: string
}

export function AddTransactionModal({
	children,
	onSuccess,
}: {
	children: React.ReactNode
	onSuccess?: () => void
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [rawInput, setRawInput] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [confirmationData, setConfirmationData] = useState<ParsedData | null>(
		null,
	)

	const handleAiParse = async () => {
		if (!rawInput.trim()) return
		setIsLoading(true)
		try {
			const resParse = await fetch("/api/ai/parse", {
				method: "POST",
				body: JSON.stringify({ rawInput }),
			})

			if (!resParse.ok) throw new Error("Gagal memproses input")

			const data = await resParse.json()
			setConfirmationData(data)
		} catch (err: any) {
			toast.error(err.message || "Gagal memproses AI")
		} finally {
			setIsLoading(false)
		}
	}

	const handleConfirm = async () => {
		if (!confirmationData) return
		setIsLoading(true)
		try {
			const res = await fetch("/api/transactions/confirm", {
				method: "POST",
				body: JSON.stringify({
					rawInput,
					...confirmationData,
				}),
			})

			if (!res.ok) throw new Error("Gagal menyimpan transaksi")

			toast.success("Transaksi berhasil dicatat!")
			setIsOpen(false)
			setRawInput("")
			setConfirmationData(null)
			if (onSuccess) onSuccess()
		} catch (err: any) {
			toast.error(err.message || "Gagal menyimpan")
		} finally {
			setIsLoading(false)
		}
	}

	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount)
	}

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger render={children as React.ReactElement} />
			<SheetContent
				side="bottom"
				className="rounded-t-3xl bg-gray-950 border-gray-800 p-6 sm:max-w-md mx-auto h-[80vh] flex flex-col"
			>
				<SheetHeader className="pb-4">
					<SheetTitle className="flex items-center gap-2 text-xl font-bold">
						<Sparkles className="w-5 h-5 text-emerald-400" /> Catat Transaksi
					</SheetTitle>
				</SheetHeader>

				{!confirmationData ? (
					<div className="space-y-6 flex-1">
						<div className="space-y-4">
							<p className="text-sm text-gray-400">
								Gunakan bahasa alami untuk mencatat. Contoh:{" "}
								<code className="text-emerald-300">"makan bakso 25rb"</code> atau{" "}
								<code className="text-emerald-300">"gajian 5jt"</code>
							</p>
							<div className="relative">
								<Input
									placeholder="Tulis transaksi di sini..."
									className="bg-gray-900 border-gray-800 h-16 text-lg rounded-2xl pr-12 focus-visible:ring-emerald-500"
									value={rawInput}
									onChange={(e) => setRawInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleAiParse()}
									autoFocus
								/>
								<Button
									size="icon"
									variant="ghost"
									className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400"
									onClick={handleAiParse}
									disabled={isLoading || !rawInput.trim()}
								>
									{isLoading ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										<Sparkles className="w-5 h-5" />
									)}
								</Button>
							</div>
						</div>

						{/* Quick Tips */}
						<div className="grid grid-cols-2 gap-3 pb-8">
							{["Kopi 15k", "Besok bayar 2jt", "Gajian 10jt", "Bensin 20rb"].map(
								(tip) => (
									<Button
										key={tip}
										variant="outline"
										className="text-xs bg-gray-900/50 border-gray-800 h-10 rounded-xl justify-start text-gray-400 hover:text-gray-100"
										onClick={() => setRawInput(tip)}
									>
										{tip}
									</Button>
								),
							)}
						</div>
					</div>
				) : (
					<div className="space-y-6 flex-1 animate-in slide-in-from-bottom duration-300">
						<div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
							<div className="flex justify-between items-start">
								<Badge
									className={cn(
										"px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
										confirmationData.type === "income"
											? "bg-emerald-500/10 text-emerald-400"
											: "bg-red-500/10 text-red-400",
									)}
								>
									{confirmationData.type === "income" ? "Pemasukan" : "Pengeluaran"}
								</Badge>
								<div className="text-gray-500 text-[10px] font-medium flex items-center gap-1">
									<AlertCircle className="w-3 h-3" /> Konfirmasi Data
								</div>
							</div>

							<div className="space-y-1">
								<div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
									Kategori
								</div>
								<div className="text-xl font-bold flex items-center gap-2">
									<span className="text-2xl">
										{confirmationData.type === "income" ? "💰" : "🍕"}
									</span>
									{confirmationData.category}
								</div>
							</div>

							<div className="space-y-1 border-t border-gray-800 pt-3">
								<div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
									Nominal
								</div>
								<div className="text-3xl font-black text-gray-100 italic">
									{formatIDR(confirmationData.amount)}
								</div>
							</div>

							<div className="space-y-1 border-t border-gray-800 pt-3">
								<div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
									Keterangan
								</div>
								<div className="text-sm text-gray-300 italic">
									"{confirmationData.description}"
								</div>
							</div>
						</div>

						<div className="flex gap-4">
							<Button
								variant="outline"
								className="flex-1 h-14 rounded-2xl border-gray-800 text-gray-400 hover:bg-gray-900"
								onClick={() => setConfirmationData(null)}
								disabled={isLoading}
							>
								<X className="w-5 h-5 mr-2" /> Batal
							</Button>
							<Button
								className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
								onClick={handleConfirm}
								disabled={isLoading}
							>
								{isLoading ? (
									<Loader2 className="w-5 h-5 animate-spin mr-2" />
								) : (
									<Check className="w-5 h-5 mr-2" />
								)}{" "}
								Simpan
							</Button>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}
