"use client"

import { useState, useEffect } from "react"
import {
	LogOut,
	Trash2,
	Calendar,
	Sparkles,
	AlertCircle,
	Loader2,
	Eye,
	EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
	const router = useRouter()
	const [salaryDay, setSalaryDay] = useState("25")
	const [monthlyBudget, setMonthlyBudget] = useState("0")
	const [usage, setUsage] = useState({ chatUsed: 0, parseUsed: 0 })
	const [loading, setLoading] = useState(true)
	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
	const [resetPassword, setResetPassword] = useState("")
	const [isResetting, setIsResetting] = useState(false)
	const [showResetPassword, setShowResetPassword] = useState(false)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [setRes, useRes] = await Promise.all([
					fetch("/api/settings"),
					fetch("/api/stats/usage"),
				])
				const settings = await setRes.json()
				const usageData = await useRes.json()

				setSalaryDay(settings.salary_day || "25")
				setMonthlyBudget(settings.monthly_budget || "0")
				setUsage(usageData)
			} catch (err) {
				console.error("Failed to fetch settings")
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [])

	const updateSettings = async () => {
		try {
			const res = await fetch("/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					salary_day: salaryDay,
					monthly_budget: monthlyBudget,
				}),
			})
			if (res.ok) {
				toast.success("Pengaturan disimpan")
			}
		} catch (err) {
			toast.error("Gagal menyimpan pengaturan")
		}
	}

	const confirmReset = async () => {
		setIsResetting(true)
		try {
			const res = await fetch("/api/settings/reset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: resetPassword }),
			})
			const data = await res.json()

			if (res.ok) {
				toast.success("Data berhasil direset")
				setIsResetDialogOpen(false)
				router.push("/")
			} else {
				toast.error(data.error || "Gagal mereset data")
			}
		} catch (err) {
			toast.error("Gagal mereset data")
		} finally {
			setIsResetting(false)
			setResetPassword("")
		}
	}

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" })
		router.push("/login")
	}

	const formatDisplayNumber = (num: string) => {
		if (!num) return ""
		return new Intl.NumberFormat("id-ID").format(Number(num))
	}

	return (
		<div className="p-4 pb-5 space-y-5">
			<h1 className="text-xl font-black italic text-slate-100">Pengaturan</h1>
			{/* AI Activity */}
			<Card className="bg-slate-900/40 border-white/5 shadow-premium rounded-2xl backdrop-blur-md overflow-hidden">
				<CardHeader className="pb-2">
					<div className="flex items-center gap-2 text-cyan-400">
						<Sparkles className="w-4 h-4" />
						<CardTitle className="text-sm font-black italic text-slate-100">
							Aktivitas AI
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div className="p-3 bg-white/5 rounded-2xl border border-white/5">
							<p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
								Prompt Chat
							</p>
							<div className="text-lg font-black italic text-cyan-400 min-h-[28px]">
								{loading ? (
									<Skeleton className="h-6 w-10 bg-slate-800/40" />
								) : (
									usage.chatUsed
								)}
							</div>
						</div>
						<div className="p-3 bg-white/5 rounded-2xl border border-white/5">
							<p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
								Input Transaksi
							</p>
							<div className="text-lg font-black italic text-emerald-400 min-h-[28px]">
								{loading ? (
									<Skeleton className="h-6 w-10 bg-slate-800/40" />
								) : (
									usage.parseUsed
								)}
							</div>
						</div>
					</div>
					<p className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-wider leading-relaxed text-center">
						Statistik penggunaan asisten Dompeto hari ini.
					</p>
				</CardContent>
			</Card>

			{/* App Settings */}
			<Card className="bg-slate-900/40 border-white/5 shadow-premium rounded-2xl backdrop-blur-md overflow-hidden">
				<CardHeader>
					<div className="flex items-center gap-2 text-emerald-400">
						<Calendar className="w-4 h-4" />
						<CardTitle className="text-sm font-black italic text-slate-100">
							Keuangan
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
							Anggaran Bulanan
						</label>
						{loading ? (
							<Skeleton className="h-11 w-full rounded-xl bg-slate-800/40" />
						) : (
							<Input
								type="text"
								inputMode="numeric"
								className="bg-slate-950/40 border-white/5 h-11 rounded-xl text-sm font-black italic text-slate-100 shadow-inner"
								value={formatDisplayNumber(monthlyBudget)}
								onChange={(e) => setMonthlyBudget(e.target.value.replace(/\D/g, ""))}
								placeholder="Masukkan total anggaran..."
							/>
						)}
					</div>

					<div className="space-y-2">
						<label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
							Tanggal Gajian Harian
						</label>
						{loading ? (
							<Skeleton className="h-11 w-full rounded-xl bg-slate-800/40" />
						) : (
							<Input
								type="number"
								min="1"
								max="31"
								className="bg-slate-950/40 border-white/5 h-11 rounded-xl text-sm font-black italic text-slate-100 shadow-inner"
								value={salaryDay}
								onChange={(e) => setSalaryDay(e.target.value)}
							/>
						)}
					</div>

					<Button
						onClick={updateSettings}
						disabled={loading}
						className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-[10px] shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
					>
						SIMPAN PENGATURAN
					</Button>

					<div className="pt-4 space-y-2">
						<Button
							variant="outline"
							className="w-full h-11 rounded-xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-black italic text-[10px] gap-2"
							onClick={() => setIsResetDialogOpen(true)}
						>
							<Trash2 className="w-3.5 h-3.5" />
							RESET SELURUH DATA
						</Button>

						<Button
							variant="ghost"
							className="w-full h-11 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 font-black italic text-[10px] gap-2"
							onClick={handleLogout}
						>
							<LogOut className="w-3.5 h-3.5" />
							KELUAR DARI AKUN
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Reset Confirmation Dialog */}
			<Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
				<DialogContent className="bg-slate-950 border-white/10 rounded-[2rem] w-[90%] max-w-sm mx-auto overflow-hidden">
					<DialogHeader className="flex flex-col items-center text-center space-y-4">
						<div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
							<AlertCircle className="w-6 h-6 text-red-500" />
						</div>
						<div className="space-y-1">
							<DialogTitle className="text-xl font-black italic text-slate-100 uppercase tracking-tight">
								Hapus Seluruh Data?
							</DialogTitle>
							<DialogDescription className="text-xs font-bold text-slate-500 leading-relaxed px-4">
								Tindakan ini akan menghapus permanen seluruh transaksi dan statistik.
								Masukkan password login Anda untuk melanjutkan.
							</DialogDescription>
						</div>
					</DialogHeader>

					<div className="py-4 px-2">
						<div className="relative group">
							<Input
								type={showResetPassword ? "text" : "password"}
								placeholder="Password Anda"
								className="bg-slate-900/50 border-white/5 h-12 rounded-2xl text-center font-black italic text-slate-100 shadow-inner focus:ring-red-500/20 focus:border-red-500/40 pr-12"
								value={resetPassword}
								onChange={(e) => setResetPassword(e.target.value)}
							/>
							<button
								type="button"
								onClick={() => setShowResetPassword(!showResetPassword)}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-400 transition-colors"
							>
								{showResetPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					<DialogFooter className="flex flex-col gap-2 p-2">
						<Button
							onClick={confirmReset}
							disabled={!resetPassword || isResetting}
							className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black italic uppercase text-xs border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
						>
							{isResetting ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								"YA, HAPUS SEKARANG"
							)}
						</Button>
						<Button
							variant="ghost"
							onClick={() => setIsResetDialogOpen(false)}
							className="w-full text-slate-500 font-black italic text-[10px] uppercase hover:bg-white/5 rounded-2xl"
						>
							BATALKAN
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
