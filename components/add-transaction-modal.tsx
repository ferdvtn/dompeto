"use client"

import { useState, useRef, useEffect } from "react"
import {
	Plus,
	Sparkles,
	Loader2,
	Check,
	Calendar,
	Receipt,
	Info,
	PieChart,
	Image as ImageIcon,
	X,
	ShoppingCart,
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
	const [mounted, setMounted] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [rawInput, setRawInput] = useState("")
	const [loading, setLoading] = useState(false)
	const [confirmationData, setConfirmationData] = useState<any>(null)
	const [includeInBudget, setIncludeInBudget] = useState(true)
	const inputRef = useRef<HTMLInputElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [isScanning, setIsScanning] = useState(false)
	const [scanResult, setScanResult] = useState<any>(null)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return children

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
			setIncludeInBudget(true)
			if (inputToParse) setRawInput(inputToParse)
		} catch (err: any) {
			toast.error(err.message || "Gagal memproses input")
		} finally {
			setLoading(false)
		}
	}

	const compressImage = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				const img = new Image()
				img.onload = () => {
					const canvas = document.createElement("canvas")
					let width = img.width
					let height = img.height

					// Max dimension 1200px (enough for OCR but small enough for API)
					const MAX_SIZE = 1200
					if (width > height) {
						if (width > MAX_SIZE) {
							height *= MAX_SIZE / width
							width = MAX_SIZE
						}
					} else {
						if (height > MAX_SIZE) {
							width *= MAX_SIZE / height
							height = MAX_SIZE
						}
					}

					canvas.width = width
					canvas.height = height
					const ctx = canvas.getContext("2d")
					ctx?.drawImage(img, 0, 0, width, height)
					// Compress to 0.7 quality
					const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1]
					resolve(base64)
				}
				img.onerror = reject
				img.src = e.target?.result as string
			}
			reader.onerror = reject
			reader.readAsDataURL(file)
		})
	}

	const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setIsScanning(true)
		setLoading(true)
		try {
			const base64 = await compressImage(file)

			const res = await fetch("/api/transactions/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ image: base64 }),
			})

			if (!res.ok) {
				const errorText = await res.text()
				let message = "Gagal memproses struk"
				try {
					const errorData = JSON.parse(errorText)
					message = errorData.error || message
				} catch {
					message = `Server Error (${res.status})`
				}
				throw new Error(message)
			}

			const data = await res.json()
			setScanResult(data.scanResult)
			toast.success("Gambar struk berhasil diproses")
		} catch (err: any) {
			console.error("Scan Error Details:", err)
			toast.error(err.message || "Gagal memproses struk")
		} finally {
			setIsScanning(false)
			setLoading(false)
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}

	const handleConfirm = async () => {
		setLoading(true)
		try {
			const res = await fetch("/api/transactions/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...confirmationData,
					rawInput,
					include_in_budget: includeInBudget ? 1 : 0,
				}),
			})
			if (!res.ok) throw new Error("Gagal menyimpan transaksi")
			toast.success("Transaksi berhasil dicatat")
			setIsOpen(false)
			resetForm()
			onSuccess?.()
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			setLoading(false)
		}
	}

	const updateScanItem = (index: number, field: string, value: any) => {
		if (!scanResult) return
		const newItems = [...scanResult.items]
		newItems[index] = { ...newItems[index], [field]: value }
		setScanResult({ ...scanResult, items: newItems })
	}

	const handleBulkConfirm = async () => {
		if (!scanResult) return
		setLoading(true)
		try {
			// Group items by category
			const groupedItems = scanResult.items.reduce((acc: any[], item: any) => {
				const existing = acc.find((g) => g.category === item.category)
				if (existing) {
					existing.amount += item.amount
					existing.name += `, ${item.name}`
					// Limit description length
					if (existing.name.length > 100) {
						existing.name = existing.name.substring(0, 97) + "..."
					}
				} else {
					acc.push({ ...item })
				}
				return acc
			}, [])

			const res = await fetch("/api/transactions/bulk", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: groupedItems,
					date: scanResult.date,
				}),
			})
			if (!res.ok) throw new Error("Gagal menyimpan semua transaksi")
			toast.success(`${groupedItems.length} kategori transaksi berhasil dicatat`)
			setIsOpen(false)
			resetForm()
			onSuccess?.()
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			setLoading(false)
		}
	}

	const resetForm = () => {
		setRawInput("")
		setConfirmationData(null)
		setScanResult(null)
		setIsScanning(false)
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
				if (!o) resetForm()
			}}
		>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent className="rounded-t-[2rem] bg-[#0f172a] border-t border-white/5 outline-none max-h-[96dvh] flex flex-col shadow-2xl overflow-hidden">
				<div className="mx-auto w-10 h-1 bg-slate-800 rounded-full my-4 shrink-0" />

				<div className="flex-1 overflow-y-auto px-6 pb-2 custom-scrollbar">
					<DrawerHeader className="p-0 text-left mb-4">
						<DrawerTitle className="text-lg font-black italic flex items-center gap-3 text-slate-100">
							<Sparkles
								className={cn("w-5 h-5 text-emerald-500", loading && "animate-pulse")}
							/>
							{scanResult ? "Hasil Scan Struk" : "AI Dompeto"}
						</DrawerTitle>
					</DrawerHeader>

					<div className="space-y-5 py-2 font-sans">
						{!confirmationData && !scanResult ? (
							<div className="space-y-5">
								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
											Ketik atau Scan
										</label>
										<div className="flex gap-2">
											<div className="relative group flex-1">
												<Input
													ref={inputRef}
													placeholder="Contoh: kopi 20k..."
													className="bg-slate-900/40 border-white/5 h-11 rounded-xl text-sm font-bold italic shadow-inner focus-visible:ring-emerald-500 text-slate-100 placeholder:text-slate-700 px-4"
													value={rawInput}
													onChange={(e) => setRawInput(e.target.value)}
													onKeyDown={(e) => e.key === "Enter" && handleParse()}
												/>
											</div>
											<input
												type="file"
												ref={fileInputRef}
												className="hidden"
												accept="image/*"
												onChange={handleScan}
											/>
											<Button
												variant="outline"
												size="icon"
												className="h-11 w-11 shrink-0 rounded-xl bg-slate-900/40 border-white/5 text-emerald-500 hover:text-emerald-400 hover:bg-slate-900 transition-all active:scale-95"
												onClick={() => fileInputRef.current?.click()}
												disabled={loading}
											>
												{isScanning ? (
													<Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
												) : (
													<ImageIcon className="w-5 h-5" />
												)}
											</Button>
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
							</div>
						) : scanResult ? (
							<div className="space-y-4">
								<div className="p-4 bg-slate-800/40 rounded-2xl border border-white/10 space-y-3">
									<div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
										<span className="flex items-center gap-1.5 text-emerald-500">
											<ShoppingCart className="w-3 h-3" /> {scanResult.items.length} Barang
											Terdeteksi
										</span>
										<span className="flex items-center gap-1.5 hover:text-slate-300 cursor-pointer">
											<Calendar className="w-3 h-3" />{" "}
											<input
												type="date"
												className="bg-transparent border-none outline-none text-right w-24"
												value={scanResult.date || ""}
												onChange={(e) =>
													setScanResult({ ...scanResult, date: e.target.value })
												}
											/>
										</span>
									</div>

									<div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
										{scanResult.items.map((item: any, idx: number) => (
											<div
												key={idx}
												className="flex flex-col gap-1 py-3 border-b border-white/5 last:border-0 group"
											>
												<div className="flex justify-between items-start">
													<input
														className="text-[11px] font-bold text-slate-100 bg-transparent border-none focus:ring-1 focus:ring-emerald-500/30 rounded px-1 -ml-1 w-full"
														value={item.name}
														onChange={(e) => updateScanItem(idx, "name", e.target.value)}
													/>
													<div className="flex items-center gap-1">
														<span className="text-[10px] font-bold text-slate-600">Rp</span>
														<input
															type="number"
															className="text-[11px] font-black italic text-red-400 bg-transparent border-none focus:ring-1 focus:ring-emerald-500/30 rounded px-1 w-20 text-right"
															value={item.amount}
															onChange={(e) =>
																updateScanItem(idx, "amount", Number(e.target.value))
															}
														/>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<select
														className="text-[9px] font-black uppercase text-slate-500 tracking-tighter bg-slate-900/60 border border-white/5 rounded px-1.5 py-0.5 focus:border-emerald-500/50 outline-none"
														value={item.category}
														onChange={(e) => updateScanItem(idx, "category", e.target.value)}
													>
														{[
															"Makan & Minuman",
															"Transport",
															"Belanja",
															"Hiburan",
															"Kesehatan",
															"Tagihan & Utilitas",
															"Pendidikan",
															"Invest",
															"Lainnya",
														].map((c) => (
															<option key={c} value={c}>
																{c}
															</option>
														))}
													</select>
													<div className="h-px flex-1 bg-white/5" />
													<button
														onClick={() => {
															const newItems = scanResult.items.filter(
																(_: any, i: number) => i !== idx,
															)
															setScanResult({ ...scanResult, items: newItems })
														}}
														className="text-slate-600 hover:text-red-400 transition-colors"
													>
														<X className="w-3 h-3" />
													</button>
												</div>
											</div>
										))}
									</div>

									<div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col gap-2">
										<div className="flex justify-between items-center">
											<span className="text-[10px] font-black uppercase text-emerald-500/80">
												Total Item Terpilih
											</span>
											<span className="text-sm font-black italic text-emerald-400">
												{formatIDR(
													scanResult.items.reduce(
														(acc: number, item: any) => acc + item.amount,
														0,
													),
												)}
											</span>
										</div>
										<p className="text-[8px] text-slate-500 font-bold uppercase italic text-center border-t border-emerald-500/10 pt-1.5">
											Transaksi akan disimpan berkelompok per kategori
										</p>
									</div>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-3 pt-1">
									<div className="p-3 bg-slate-800/40 rounded-2xl border border-white/10 space-y-1 shadow-inner">
										<div className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
											<Receipt className="w-2.5 h-2.5" /> Nominal
										</div>
										<div
											className={cn(
												"text-sm font-black italic",
												confirmationData.type === "income"
													? "text-emerald-400"
													: "text-red-400",
											)}
										>
											{confirmationData.type === "income" ? "+" : "-"}{" "}
											{formatIDR(confirmationData.amount)}
										</div>
									</div>
									<div className="p-3 bg-slate-800/40 rounded-2xl border border-white/10 space-y-1 shadow-inner">
										<div className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
											<PieChart className="w-2.5 h-2.5" /> Kategori
										</div>
										<div className="text-sm font-black italic text-slate-100 tracking-tighter">
											{confirmationData.category}
										</div>
									</div>
								</div>

								<div className="space-y-1.5 border-t border-white/5 pt-4">
									<div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
										<Info className="w-2.5 h-2.5" /> Keterangan
									</div>
									<div className="text-[11px] text-slate-300 font-bold italic bg-slate-800/40 p-2.5 rounded-xl border border-white/10 shadow-inner leading-relaxed">
										"{confirmationData.description || rawInput}"
									</div>
								</div>

								<div className="flex items-center justify-between w-full p-3 bg-slate-800/60 rounded-2xl border border-white/10 shadow-inner group transition-all">
									<div className="flex items-center gap-3">
										<div
											className={cn(
												"p-2 rounded-xl transition-all duration-300",
												includeInBudget
													? "bg-emerald-500/10 text-emerald-400"
													: "bg-slate-800 text-slate-600",
											)}
										>
											<Calendar className="w-3.5 h-3.5" />
										</div>
										<div className="text-left">
											<p className="text-[10px] font-black italic text-slate-100 uppercase tracking-tight">
												Libatkan Anggaran
											</p>
											<p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
												Pengaruhi sisa kuota gaji
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setIncludeInBudget(!includeInBudget)}
										className={cn(
											"w-10 h-5 rounded-full relative transition-all duration-300 active:scale-95 shadow-lg",
											includeInBudget
												? "bg-emerald-600 shadow-emerald-500/10"
												: "bg-slate-800",
										)}
									>
										<div
											className={cn(
												"absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
												includeInBudget ? "left-6" : "left-1",
											)}
										/>
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="p-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,1.5rem))] border-t border-white/5 bg-[#070b1a]/80 backdrop-blur-md shrink-0">
					{!confirmationData && !scanResult ? (
						<Button
							className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-xs shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
							onClick={() => handleParse()}
							disabled={loading || !rawInput.trim()}
						>
							{loading ? (
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
							) : (
								<Plus className="w-4 h-4 mr-2" />
							)}
							PROSES AI
						</Button>
					) : scanResult ? (
						<div className="flex gap-3">
							<Button
								variant="outline"
								className="flex-1 h-12 rounded-xl border-white/10 bg-slate-950/20 text-slate-500 font-black italic text-[9px] uppercase tracking-widest"
								onClick={() => setScanResult(null)}
							>
								BATAL
							</Button>
							<Button
								className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-xs shadow-xl shadow-emerald-950/20 gap-3 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
								onClick={handleBulkConfirm}
								disabled={loading}
							>
								{loading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Check className="w-4 h-4" />
								)}
								SIMPAN SEMUA
							</Button>
						</div>
					) : (
						<div className="flex gap-3">
							<Button
								variant="outline"
								className="flex-1 h-12 rounded-xl border-white/10 bg-slate-950/20 text-slate-500 font-black italic text-[9px] uppercase tracking-widest"
								onClick={() => setConfirmationData(null)}
							>
								RESET
							</Button>
							<Button
								className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-xs shadow-xl shadow-emerald-950/20 gap-3 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
								onClick={handleConfirm}
								disabled={loading}
							>
								{loading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Check className="w-4 h-4" />
								)}
								KONFIRMASI
							</Button>
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	)
}
