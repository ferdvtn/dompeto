"use client"

import { useState, useEffect, useRef } from "react"
import {
	Send,
	Bot,
	User,
	Loader2,
	Sparkles,
	Receipt,
	ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const CHAT_SUGGESTIONS = [
	"Rekap pengeluaran hari ini",
	"Sisa budget gaji saya?",
	"Habis berapa kemarin?",
	"Pengeluaran 30 hari terakhir",
	"Total pemasukan bulan ini",
]

export default function ChatPage() {
	const router = useRouter()
	const [messages, setMessages] = useState<any[]>([])
	const [input, setInput] = useState("")
	const [loading, setLoading] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const isInitialMount = useRef(true)

	// Load history on mount
	useEffect(() => {
		const saved = localStorage.getItem("dompeto_chat_history")
		if (saved) {
			try {
				setMessages(JSON.parse(saved))
			} catch (e) {
				console.error("Failed to parse chat history")
			}
		} else {
			setMessages([
				{
					role: "assistant",
					content:
						"Halo! Saya asisten keuangan Dompeto. Ada yang bisa saya bantu hari ini?",
				},
			])
		}
	}, [])

	// Save history on change (limit 50)
	useEffect(() => {
		if (messages.length > 0) {
			const toSave = messages.slice(-50)
			localStorage.setItem("dompeto_chat_history", JSON.stringify(toSave))
		}
	}, [messages])

	useEffect(() => {
		if (messages.length > 0) {
			if (isInitialMount.current) {
				scrollRef.current?.scrollIntoView({ behavior: "auto" })
				isInitialMount.current = false
			} else {
				scrollRef.current?.scrollIntoView({ behavior: "smooth" })
			}
		}
	}, [messages])

	const sendMessage = async (textToSend?: string) => {
		const targetInput = textToSend || input
		if (!targetInput.trim() || loading) return

		const userMsg = { role: "user", content: targetInput }
		setMessages((prev) => [...prev, userMsg])
		if (!textToSend) setInput("")
		setLoading(true)

		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: targetInput }),
			})
			const data = await res.json()
			setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
		} catch (err) {
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: "Maaf, terjadi kesalahan pada server." },
			])
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col h-[calc(100vh-5rem)] bg-[#0f172a] text-slate-100 relative">
			{/* Header */}
			<div className="p-4 border-b border-white/5 flex items-center gap-4 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
				<button
					className="w-9 h-9 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center active:scale-95 transition-all"
					onClick={() => router.back()}
				>
					<ArrowLeft className="w-4 h-4 text-slate-500" />
				</button>
				<div>
					<h1 className="text-sm font-black italic flex items-center gap-2">
						<Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Asisten
					</h1>
					<p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
						Dompeto Intelligence
					</p>
				</div>
			</div>

			{/* Chat Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
				{messages.map((msg, i) => (
					<div
						key={i}
						className={cn(
							"flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
							msg.role === "user" ? "flex-row-reverse" : "flex-row",
						)}
					>
						<div
							className={cn(
								"w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
								msg.role === "user"
									? "bg-slate-800 border-white/10"
									: "bg-emerald-600 border-emerald-500/20 shadow-lg shadow-emerald-950/20",
							)}
						>
							{msg.role === "user" ? (
								<User className="w-4 h-4 text-slate-400" />
							) : (
								<Bot className="w-4 h-4 text-white" />
							)}
						</div>
						<div
							className={cn(
								"p-2.5 rounded-xl text-[11px] font-bold max-w-[85%] shadow-premium italic leading-relaxed whitespace-pre-wrap",
								msg.role === "user"
									? "bg-emerald-600 text-white rounded-tr-none"
									: "bg-slate-900/60 border border-white/5 text-slate-200 rounded-tl-none",
							)}
						>
							{msg.content}
						</div>
					</div>
				))}
				{loading && (
					<div className="flex gap-3 items-center text-slate-600 animate-pulse italic text-xs font-bold">
						<Loader2 className="w-4 h-4 animate-spin" />
						Asisten sedang mengetik...
					</div>
				)}
				<div ref={scrollRef} />
			</div>

			{/* Input Area */}
			<div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-slate-950/40 backdrop-blur-xl border-t border-white/5 space-y-4 z-20">
				{/* Chat Suggestions */}
				<div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
					{CHAT_SUGGESTIONS.map((s) => (
						<button
							key={s}
							onClick={() => setInput(s)}
							className="whitespace-nowrap px-3 py-1.5 bg-slate-900 border border-white/5 rounded-full text-[9px] font-bold text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all active:scale-95 shrink-0 shadow-sm"
						>
							{s}
						</button>
					))}
				</div>

				<div className="flex gap-3">
					<Input
						placeholder="Tanya apapun..."
						className="flex-1 bg-slate-900/60 border-white/5 h-11 rounded-xl font-bold italic shadow-inner px-4 text-[11px] text-slate-100 placeholder:text-slate-700 focus-visible:ring-emerald-500/30"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && sendMessage()}
					/>
					<Button
						className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/30 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center p-0"
						onClick={() => sendMessage()}
					>
						<Send className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
