"use client"

import { useState, useEffect } from "react"
import { LogOut, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
	const router = useRouter()
	const [salaryDay, setSalaryDay] = useState("25")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch("/api/settings")
				const settings = await res.json()
				setSalaryDay(settings.salary_day || "25")
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
				body: JSON.stringify({ salary_day: salaryDay }),
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
		<div className="p-4 pb-24 space-y-6">
			<h1 className="text-2xl font-black italic text-slate-100">Pengaturan</h1>

			{/* App Settings */}
			<Card className="bg-slate-900/40 border-white/5 shadow-premium rounded-[2rem] backdrop-blur-md overflow-hidden">
				<CardHeader>
					<div className="flex items-center gap-2 text-emerald-400">
						<Calendar className="w-5 h-5" />
						<CardTitle className="text-base font-black italic text-slate-100">
							Keuangan
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
							Tanggal Gajian Harian
						</label>
						<div className="flex gap-2">
							<Input
								type="number"
								min="1"
								max="31"
								className="flex-1 bg-slate-950/40 border-white/5 h-12 rounded-2xl text-base font-black italic text-slate-100 shadow-inner"
								value={salaryDay}
								onChange={(e) => setSalaryDay(e.target.value)}
							/>
							<Button
								onClick={updateSettings}
								className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-xs shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
							>
								SIMPAN
							</Button>
						</div>
					</div>

					<div className="pt-4 space-y-3">
						<Button
							variant="outline"
							className="w-full h-12 rounded-2xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-black italic text-xs gap-3"
							onClick={handleResetData}
						>
							<Trash2 className="w-4 h-4" />
							RESET SELURUH DATA
						</Button>

						<Button
							variant="ghost"
							className="w-full h-12 rounded-2xl text-slate-500 hover:text-slate-300 hover:bg-white/5 font-black italic text-xs gap-3"
							onClick={handleLogout}
						>
							<LogOut className="w-4 h-4" />
							KELUAR DARI AKUN
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
