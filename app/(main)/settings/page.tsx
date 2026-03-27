"use client"

import { useEffect, useState } from "react"
import {
	Save,
	Calendar,
	Wallet,
	Shield,
	Ban,
	MessageSquare,
} from "lucide-react"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function SettingsPage() {
	const [settings, setSettings] = useState<{ [key: string]: string }>({})
	const [aiCount, setAiCount] = useState(0)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState<string | null>(null)

	useEffect(() => {
		// Load existing settings & AI usage count
		Promise.all([
			fetch("/api/stats/charts").then((res) => res.json()),
			fetch("/api/stats/usage").then((res) => res.json()),
		]).then(([data, usage]) => {
			setSettings({
				salary_day: "25",
				monthly_budget: String(data.cycle.budget),
			})
			if (usage.count !== undefined) setAiCount(usage.count)
			setLoading(false)
		})
	}, [])

	const updateSetting = async (key: string, value: string) => {
		setSaving(key)
		try {
			const res = await fetch("/api/settings", {
				method: "PATCH",
				body: JSON.stringify({ key, value }),
			})
			if (!res.ok) throw new Error("Gagal menyimpan")
			setSettings((prev) => ({ ...prev, [key]: value }))
			toast.success("Pengaturan diperbarui")
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			setSaving(null)
		}
	}

	const handleResetDatabase = async () => {
		if (
			!confirm(
				"Apakah Anda yakin ingin menghapus SELURUH data? Tindakan ini tidak dapat dibatalkan.",
			)
		)
			return

		setLoading(true)
		try {
			const res = await fetch("/api/settings/reset", { method: "POST" })
			if (!res.ok) throw new Error("Gagal meriset database")
			toast.success("Database berhasil direset")
			window.location.reload()
		} catch (err: any) {
			toast.error(err.message)
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="p-4 space-y-6">
				<Skeleton className="h-64 w-full rounded-3xl" />
				<Skeleton className="h-48 w-full rounded-3xl" />
			</div>
		)
	}

	return (
		<div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
			<h1 className="text-2xl font-black italic">Setelan</h1>

			{/* Budget Settings */}
			<Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
				<CardHeader>
					<div className="flex items-center gap-2 text-emerald-400 mb-1">
						<Wallet className="w-5 h-5" />
						<CardTitle className="text-lg font-black italic">
							Target Anggaran
						</CardTitle>
					</div>
					<CardDescription className="text-[10px] font-bold uppercase tracking-tight text-gray-500">
						Tentukan batas pengiriman bulanan Anda
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
							Budget Bulanan (IDR)
						</Label>
						<div className="flex gap-2">
							<Input
								type="number"
								className="bg-gray-800 border-gray-700 h-12 rounded-xl text-lg font-black italic"
								value={settings.monthly_budget || ""}
								onChange={(e) =>
									setSettings({ ...settings, monthly_budget: e.target.value })
								}
							/>
							<Button
								className="h-12 w-12 rounded-xl bg-emerald-500"
								onClick={() => updateSetting("monthly_budget", settings.monthly_budget)}
								disabled={saving === "monthly_budget"}
							>
								<Save className="w-5 h-5" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Cycle Settings */}
			<Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
				<CardHeader>
					<div className="flex items-center gap-2 text-cyan-400 mb-1">
						<Calendar className="w-5 h-5" />
						<CardTitle className="text-lg font-black italic">Siklus Gaji</CardTitle>
					</div>
					<CardDescription className="text-[10px] font-bold uppercase tracking-tight text-gray-500">
						Tanggal reset budget bulanan
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
							Tanggal Gajian (1-28)
						</Label>
						<div className="flex gap-2">
							<Input
								type="number"
								min="1"
								max="28"
								className="bg-gray-800 border-gray-700 h-12 rounded-xl text-lg font-black italic"
								value={settings.salary_day || "25"}
								onChange={(e) =>
									setSettings({ ...settings, salary_day: e.target.value })
								}
							/>
							<Button
								className="h-12 w-12 rounded-xl bg-cyan-500"
								onClick={() => updateSetting("salary_day", settings.salary_day)}
								disabled={saving === "salary_day"}
							>
								<Save className="w-5 h-5" />
							</Button>
						</div>
					</div>

					{/* AI Usage Display (Simple Text Only) */}
					<div className="pt-6 border-t border-gray-800 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center text-cyan-400 shadow-inner">
								<MessageSquare className="w-5 h-5" />
							</div>
							<div>
								<div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
									Aktivitas AI (Hari Ini)
								</div>
								<div className="text-sm font-black italic text-gray-100">
									{aiCount} Chat Terkirim
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Account Mode */}
			<Card className="bg-gray-950 border-gray-800 border-dashed">
				<CardContent className="p-4 flex items-center gap-4">
					<div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
						<Shield className="w-6 h-6 text-gray-500" />
					</div>
					<div>
						<div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
							Mode Akun
						</div>
						<div className="text-sm font-bold italic text-gray-400">
							Single User Instance (Admin)
						</div>
					</div>
				</CardContent>
			</Card>

			<Button
				variant="ghost"
				className="w-full h-12 rounded-xl text-red-500/50 border border-red-500/10 hover:bg-red-500/5 gap-2 uppercase text-[10px] font-black tracking-widest"
				onClick={handleResetDatabase}
				disabled={loading}
			>
				<Ban className="w-4 h-4" /> Reset Database
			</Button>
		</div>
	)
}
