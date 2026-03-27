"use client"

import { useState, useEffect } from "react"
import { LogOut, Trash2, Calendar, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
	const router = useRouter()
	const [salaryDay, setSalaryDay] = useState("25")
	const [monthlyBudget, setMonthlyBudget] = useState("0")
	const [usage, setUsage] = useState({ chatUsed: 0, parseUsed: 0 })
	const [loading, setLoading] = useState(true)

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

	const handleResetData = async () => {
		if (
			!confirm(
				"Hapus seluruh data transaksi? Tindakan ini tidak dapat dibatalkan.",
			)
		)
			return

		try {
			const res = await fetch("/api/settings/reset", { method: "POST" })
			if (res.ok) {
				toast.success("Data berhasil direset")
				router.push("/")
			}
		} catch (err) {
			toast.error("Gagal mereset data")
		}
	}

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" })
		router.push("/login")
	}

	return (
		<div className="p-4 pb-24 space-y-5">
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
							<p className="text-lg font-black italic text-cyan-400">
								{usage.chatUsed}
							</p>
						</div>
						<div className="p-3 bg-white/5 rounded-2xl border border-white/5">
							<p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
								Input Transaksi
							</p>
							<p className="text-lg font-black italic text-emerald-400">
								{usage.parseUsed}
							</p>
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
						<Input
							type="number"
							className="bg-slate-950/40 border-white/5 h-11 rounded-xl text-sm font-black italic text-slate-100 shadow-inner"
							value={monthlyBudget}
							onChange={(e) => setMonthlyBudget(e.target.value)}
							placeholder="Masukkan total anggaran..."
						/>
					</div>

					<div className="space-y-2">
						<label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
							Tanggal Gajian Harian
						</label>
						<Input
							type="number"
							min="1"
							max="31"
							className="bg-slate-950/40 border-white/5 h-11 rounded-xl text-sm font-black italic text-slate-100 shadow-inner"
							value={salaryDay}
							onChange={(e) => setSalaryDay(e.target.value)}
						/>
					</div>

					<Button
						onClick={updateSettings}
						className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-[10px] shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
					>
						SIMPAN PENGATURAN
					</Button>

					<div className="pt-4 space-y-2">
						<Button
							variant="outline"
							className="w-full h-11 rounded-xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-black italic text-[10px] gap-2"
							onClick={handleResetData}
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
		</div>
	)
}
