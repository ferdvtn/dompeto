"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { PageHeader, LoadError } from "@/components/page-ui"
import { FormPanel } from "@/components/form-panel"
import { api, jsonBody, errorMessage } from "@/lib/client-api"
import { formatIDR } from "@/lib/finance"
export default function SettingsPage() {
	const router = useRouter()
	const [day, setDay] = useState("25"),
		[budget, setBudget] = useState("0"),
		[usage, setUsage] = useState<{
			chatUsed: number
			parseUsed: number
		} | null>(null)
	const [loaded, setLoaded] = useState(false),
		[loadError, setLoadError] = useState(false),
		[version, setVersion] = useState(0),
		[busy, setBusy] = useState(false),
		[error, setError] = useState("")
	const [reset, setReset] = useState(false),
		[password, setPassword] = useState(""),
		[visible, setVisible] = useState(false),
		[reminder, setReminder] = useState(false)
	useEffect(() => {
		const controller = new AbortController()
		api<Record<string, string>>("/api/settings", { signal: controller.signal })
			.then((s) => {
				setDay(s.salary_day || "25")
				setBudget(s.monthly_budget || "0")
				setLoaded(true)
				setLoadError(false)
			})
			.catch(() => {
				if (!controller.signal.aborted) setLoadError(true)
			})
		api<{ chatUsed: number; parseUsed: number }>("/api/stats/usage", {
			signal: controller.signal,
		})
			.then(setUsage)
			.catch(() => {})
		queueMicrotask(() =>
			setReminder(localStorage.getItem("dompeto_reminders") === "true"),
		)
		return () => controller.abort()
	}, [version])
	const run = async (action: () => Promise<void>) => {
		if (busy) return
		setBusy(true)
		setError("")
		try {
			await action()
		} catch (e) {
			setError(errorMessage(e))
		} finally {
			setBusy(false)
		}
	}
	return (
		<div className="page stack">
			<PageHeader
				title="Pengaturan"
				subtitle="Sesuaikan dengan ritme keuanganmu."
			/>
			{loadError ? (
				<LoadError retry={() => setVersion((v) => v + 1)} />
			) : !loaded ? (
				<div className="loading-card" />
			) : (
				<>
					<form
						className="card fields"
						onSubmit={(e) => {
							e.preventDefault()
							void run(async () => {
								await api(
									"/api/settings",
									jsonBody({ salary_day: day, monthly_budget: budget }),
								)
								toast.success("Pengaturan disimpan")
							})
						}}
					>
						<h2>Anggaran dan siklus gaji</h2>
						<label className="field">
							Batas belanja per siklus (Rp)
							<input
								inputMode="numeric"
								pattern="[0-9]+"
								required
								value={budget}
								onChange={(e) =>
									setBudget(e.target.value.replace(/[^0-9]/g, ""))
								}
							/>
							<span className="text-xs muted">
								{formatIDR(Number(budget) || 0)} · Isi 0 jika belum ingin
								mengatur anggaran.
							</span>
						</label>
						<label className="field">
							Tanggal gajian setiap bulan
							<input
								type="number"
								inputMode="numeric"
								required
								min={1}
								max={31}
								step={1}
								value={day}
								onChange={(e) => setDay(e.target.value)}
							/>
							<span className="text-xs muted">
								Untuk bulan pendek, tanggal 29–31 mengikuti hari terakhir bulan.
							</span>
						</label>
						<p className="muted text-sm">
							Anggaran adalah batas belanja tetap. Pemasukan tidak menambah
							batas ini. Perubahan berlaku juga untuk ringkasan histori.
						</p>
						<button className="btn primary" disabled={busy}>
							{busy ? "Menyimpan…" : "Simpan pengaturan"}
						</button>
					</form>
					<section className="card fields">
						<h2>Pengingat malam</h2>
						<p className="muted text-sm">
							Ringkasan setelah pukul 21.00 WIB, saat aplikasi terbuka.
							Pengaturan ini berlaku di perangkat ini.
						</p>
						<label className="row min-h-12">
							<input
								type="checkbox"
								checked={reminder}
								onChange={(e) => {
									const enabled = e.target.checked
									setReminder(enabled)
									localStorage.setItem("dompeto_reminders", String(enabled))
								}}
							/>
							Aktifkan pengingat dalam aplikasi
						</label>
						<button
							className="btn"
							onClick={async () => {
								if (!("Notification" in window)) {
									toast.info(
										"Notifikasi browser tidak tersedia. Gunakan pengingat dalam aplikasi.",
									)
									return
								}
								try {
									const permission = await Notification.requestPermission()
									toast.info(
										permission === "granted"
											? "Notifikasi browser diizinkan"
											: "Izin belum diberikan. Pengingat dalam aplikasi tetap tersedia.",
									)
								} catch {
									toast.error("Notifikasi tidak tersedia di browser ini")
								}
							}}
						>
							Izinkan notifikasi browser
						</button>
					</section>
					<section className="card fields">
						<h2>Penggunaan AI hari ini</h2>
						{usage ? (
							<div className="metrics">
								<div>
									<p className="muted text-sm">Chat</p>
									<strong>{usage.chatUsed}</strong>
								</div>
								<div>
									<p className="muted text-sm">Input AI</p>
									<strong>{usage.parseUsed}</strong>
								</div>
							</div>
						) : (
							<p className="muted text-sm">Statistik AI belum tersedia.</p>
						)}
					</section>
					<section className="card fields">
						<h2>Akun dan data</h2>
						<button
							className="btn"
							disabled={busy}
							onClick={() =>
								run(async () => {
									await api("/api/auth/logout", { method: "POST" })
									router.replace("/login")
								})
							}
						>
							Keluar dari akun
						</button>
						<p className="muted text-sm">
							Reset menghapus seluruh transaksi dan mengembalikan pengaturan
							anggaran.
						</p>
						<button
							className="btn danger"
							disabled={busy}
							onClick={() => {
								setError("")
								setReset(true)
							}}
						>
							Reset seluruh data
						</button>
					</section>
				</>
			)}
			{error && !reset && (
				<p role="alert" className="error">
					{error}
				</p>
			)}
			<FormPanel
				open={reset}
				title="Reset seluruh data"
				onClose={() => {
					if (!busy) {
						setReset(false)
						setPassword("")
						setError("")
					}
				}}
				footer={
					<>
						<button
							className="btn"
							disabled={busy}
							onClick={() => {
								setReset(false)
								setPassword("")
							}}
						>
							Batal
						</button>
						<button
							form="reset-form"
							className="btn danger"
							disabled={busy || !password}
						>
							{busy ? "Menghapus…" : "Hapus seluruh data"}
						</button>
					</>
				}
			>
				<form
					id="reset-form"
					className="fields"
					onSubmit={(e) => {
						e.preventDefault()
						void run(async () => {
							await api("/api/settings/reset", jsonBody({ password }))
							setReset(false)
							setPassword("")
							toast.success("Seluruh data direset")
							router.push("/")
						})
					}}
				>
					<p>
						Seluruh transaksi dan statistik akan dihapus permanen. Masukkan
						password untuk mengonfirmasi.
					</p>
					<label className="field">
						Password
						<input
							autoComplete="current-password"
							required
							type={visible ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</label>
					<button
						className="btn"
						type="button"
						onClick={() => setVisible((v) => !v)}
					>
						{visible ? <EyeOff size={20} /> : <Eye size={20} />}{" "}
						{visible ? "Sembunyikan" : "Tampilkan"} password
					</button>
					{error && (
						<p className="error" role="alert">
							{error}
						</p>
					)}
				</form>
			</FormPanel>
		</div>
	)
}
