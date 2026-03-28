"use client"

import { useState } from "react"
import { Wallet, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function LoginPage() {
	const router = useRouter()
	const [password, setPassword] = useState("")
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			})

			if (res.ok) {
				toast.success("Login Berhasil")
				router.push("/")
			} else {
				toast.error("Password salah")
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="w-full flex-1 flex items-center justify-center p-6 bg-[#0f172a] relative overflow-hidden">
			{/* Luxury Background Elements */}
			<div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl opacity-30" />
			<div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-3xl opacity-30" />

			<div className="w-full max-w-sm p-6 space-y-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-premium relative z-10">
				<div className="space-y-3 text-center">
					<div className="mx-auto w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800">
						<Wallet className="w-7 h-7 text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-black italic text-slate-100">Dompeto</h1>
						<p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">
							Premium Personal Finance
						</p>
					</div>
				</div>

				<form onSubmit={handleLogin} className="space-y-4">
					<div className="space-y-3">
						<div className="relative group">
							<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-emerald-500" />
							<Input
								type={showPassword ? "text" : "password"}
								placeholder="Password"
								className="pl-12 pr-12 h-12 bg-slate-950/40 border-white/5 rounded-xl text-slate-100 font-bold placeholder:text-slate-700 focus-visible:ring-emerald-500/50 shadow-inner"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-400 transition-colors"
							>
								{showPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					<Button
						type="submit"
						className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-sm shadow-xl shadow-emerald-950/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
						disabled={loading}
					>
						{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "MASUK"}
					</Button>
				</form>

				<p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest pt-2">
					Bertenaga AI • Dompeto v2.0
				</p>
			</div>
		</div>
	)
}
