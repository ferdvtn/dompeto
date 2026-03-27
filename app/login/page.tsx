"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError("")

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			})

			if (res.ok) {
				router.push("/")
			} else {
				const data = await res.json()
				setError(data.error || "Login gagal.")
			}
		} catch (err) {
			setError("Terjadi kesalahan jaringan.")
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center p-4 bg-gray-950 font-sans">
			<div className="w-full max-w-md p-8 space-y-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
				<div className="space-y-2 text-center">
					<h1 className="text-3xl font-bold tracking-tight text-gray-100">
						Dompeto
					</h1>
					<p className="text-sm text-gray-400">
						Masukkan password untuk melanjutkan
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1">
						<input
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-100 placeholder-gray-500 transition-all font-mono"
						/>
					</div>

					{error && (
						<div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-500/50 rounded-lg">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className={`w-full py-3 font-semibold text-white bg-emerald-600 rounded-xl transition-all ${
							loading
								? "opacity-70 cursor-not-allowed"
								: "hover:bg-emerald-500 active:scale-95"
						}`}
					>
						{loading ? "Memproses..." : "Masuk"}
					</button>
				</form>
			</div>
		</main>
	)
}
