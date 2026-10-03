"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Eye, EyeOff } from "lucide-react"
import { api, jsonBody, errorMessage } from "@/lib/client-api"
export default function LoginPage() {
	const router = useRouter()
	const [password, setPassword] = useState(""),
		[visible, setVisible] = useState(false),
		[busy, setBusy] = useState(false),
		[error, setError] = useState("")
	return (
		<main className="login-page">
			<section className="card login-card stack">
				<div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground grid place-items-center">
					<Wallet size={24} />
				</div>
				<div>
					<h1>Dompeto</h1>
					<p className="muted mt-2">
						Keuangan tercatat.
						<br />
						Pikiran lebih tenang.
					</p>
				</div>
				<form
					className="fields"
					onSubmit={async (e) => {
						e.preventDefault()
						if (busy) return
						setBusy(true)
						setError("")
						try {
							await api("/api/auth/login", jsonBody({ password }))
							router.replace("/")
							router.refresh()
						} catch (error) {
							setError(errorMessage(error))
						} finally {
							setBusy(false)
						}
					}}
				>
					<label className="field" htmlFor="password">
						Password
						<div className="row">
							<input
								id="password"
								type={visible ? "text" : "password"}
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
							<button
								className="icon-btn"
								type="button"
								aria-label={
									visible ? "Sembunyikan password" : "Tampilkan password"
								}
								onClick={() => setVisible((v) => !v)}
							>
								{visible ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>
						</div>
					</label>
					{error && (
						<p className="error" role="alert">
							{error}
						</p>
					)}
					<button className="btn primary" disabled={busy}>
						{busy ? "Memeriksa…" : "Masuk"}
					</button>
				</form>
				<p className="muted text-xs">
					Catat pengeluaran dan pemasukan, dalam satu tempat.
				</p>
			</section>
		</main>
	)
}
