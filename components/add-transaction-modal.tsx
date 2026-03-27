"use client"

import { useState, useRef } from "react"
import {
	Plus,
	Sparkles,
	Loader2,
	Check,
	Calendar,
	Receipt,
	Info,
} from "lucide-react"
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
	"kopi 20k",
	"makan siang 50rb",
	"gaji 10jt",
	"beli pulsa 100k",
	"bayar listrik 300rb",
]

export function AddTransactionModal({
	children,
	onSuccess,
}: {
	children: React.ReactElement
	onSuccess?: () => void
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [rawInput, setRawInput] = useState("")
	const [loading, setLoading] = useState(false)
	const [confirmationData, setConfirmationData] = useState<any>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const handleParse = async (inputToParse?: string) => {
		const targetInput = inputToParse || rawInput
		if (!targetInput.trim()) return

		setLoading(true)
		try {
			const res = await fetch("/api/ai/parse", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rawInput: targetInput }),
			})
			const data = await res.json()
			if (data.error) throw new Error(data.error)
			setConfirmationData(data)
			if (inputToParse) setRawInput(inputToParse)
		} catch (err: any) {
			toast.error(err.message || "Gagal memproses input")
		} finally {
			setLoading(false)
		}
	}

	const handleConfirm = async () => {
		setLoading(true)
		try {
			const res = await fetch("/api/transactions/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...confirmationData, rawInput }),
			})
			if (!res.ok) throw new Error("Gagal menyimpan transaksi")
			toast.success("Transaksi berhasil dicatat")
			setIsOpen(false)
			setRawInput("")
			setConfirmationData(null)
			onSuccess?.()
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			setLoading(false)
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
		<Drawer
			open={isOpen}
			onOpenChange={(o) => {
				setIsOpen(o)
				if (!o) {
					setRawInput("")
					setConfirmationData(null)
				}
			}}
		>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent className="rounded-t-[3.5rem] bg-[#020617] border-t border-white/5 p-8 sm:max-w-md mx-auto shadow-2xl overflow-hidden outline-none">
				<DrawerHeader className="p-0 text-left">
					<div className="mx-auto w-12 h-1.5 bg-slate-800 rounded-full mb-8" />
					<DrawerTitle className="text-xl font-black italic flex items-center gap-3 text-slate-100">
						<Sparkles
							className={cn("w-6 h-6 text-emerald-500", loading && "animate-pulse")}
						/>
						AI Dompeto
					</DrawerTitle>
				</DrawerHeader>

				<div className="space-y-8 py-6 font-sans">
					{!confirmationData ? (
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="space-y-2">
									<label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
										Ketik Transaksi
									</label>
									<div className="relative group">
										<Input
											ref={inputRef}
											placeholder="Contoh: kopi 20k, gaji 10jt..."
											className="bg-slate-900/40 border-white/5 h-14 rounded-2xl text-base font-bold italic shadow-inner focus-visible:ring-emerald-500 text-slate-100 placeholder:text-slate-700"
											value={rawInput}
											onChange={(e) => setRawInput(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleParse()}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
										Coba Ketik:
									</p>
									<div className="flex flex-wrap gap-2">
										{SUGGESTIONS.map((s) => (
											<button
												key={s}
												onClick={() => setRawInput(s)}
												className="px-3 py-1.5 bg-slate-900 border border-white/5 rounded-full text-[10px] font-bold text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all active:scale-95"
											>
												{s}
											</button>
										))}
									</div>
								</div>
							</div>

							<Button
								className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-sm shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
								onClick={() => handleParse()}
								disabled={loading || !rawInput.trim()}
							>
								{loading ? (
									<Loader2 className="w-5 h-5 animate-spin mr-2" />
								) : (
									<Plus className="w-5 h-5 mr-2" />
								)}
								PROSES AI
							</Button>
						</div>
					) : (
						<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
							<div className="grid grid-cols-2 gap-4">
								<div className="p-4 bg-slate-900/40 rounded-3xl border border-white/5 space-y-1 shadow-inner">
									<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Receipt className="w-3 h-3" /> Nominal
									</div>
									<div
										className={cn(
											"text-base font-black italic",
											confirmationData.type === "income"
												? "text-emerald-400"
												: "text-red-400",
										)}
									>
										{confirmationData.type === "income" ? "+" : "-"}{" "}
										{formatIDR(confirmationData.amount)}
									</div>
								</div>
								<div className="p-4 bg-slate-900/40 rounded-3xl border border-white/5 space-y-1 shadow-inner">
									<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Calendar className="w-3 h-3" /> Kategori
									</div>
									<div className="font-black italic text-slate-100 tracking-tighter">
										{confirmationData.category}
									</div>
								</div>
							</div>

							<div className="space-y-2 border-t border-white/5 pt-5">
								<div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
									<Info className="w-3 h-3" /> Keterangan
								</div>
								<div className="text-xs text-slate-300 font-bold italic bg-slate-900/40 p-3 rounded-2xl border border-white/5 shadow-inner leading-relaxed">
									"{confirmationData.description || rawInput}"
								</div>
							</div>

							<div className="flex gap-4">
								<Button
									variant="outline"
									className="flex-1 h-12 rounded-2xl border-white/10 bg-slate-950/20 text-slate-500 font-black italic text-[10px] uppercase tracking-widest"
									onClick={() => setConfirmationData(null)}
								>
									RESET
								</Button>
								<Button
									className="flex-[2] h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-xs shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
									onClick={handleConfirm}
									disabled={loading}
								>
									{loading ? (
										<Loader2 className="w-4 h-4 animate-spin mr-2" />
									) : (
										<Check className="w-4 h-4 mr-2" />
									)}
									KONFIRMASI
								</Button>
							</div>
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	)
}
