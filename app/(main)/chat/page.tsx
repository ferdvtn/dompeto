"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

interface Message {
	role: "user" | "ai"
	content: string
}

const SUGGESTIONS = [
	"Pengeluaran bulan ini",
	"Pengeluaran terbesar minggu ini",
	"Total hari ini",
	"Rekap bulan lalu",
]

export default function ChatPage() {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState("")
	const [loading, setLoading] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [messages, loading])

	const sendMessage = async (text: string) => {
		if (!text.trim() || loading) return

		const newMessages: Message[] = [...messages, { role: "user", content: text }]
		setMessages(newMessages)
		setInput("")
		setLoading(true)

		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: text }),
			})

			const data = await res.json()
			setMessages([
				...newMessages,
				{ role: "ai", content: data.reply || "Maaf, terjadi kesalahan." },
			])
		} catch (err) {
			setMessages([...newMessages, { role: "ai", content: "Kesalahan koneksi." }])
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="max-w-xl mx-auto h-screen bg-gray-950 text-gray-100 flex flex-col font-sans overflow-hidden">
			{/* Header */}
			<header className="p-4 flex items-center border-b border-gray-800 bg-gray-950/80 backdrop-blur-md z-10">
				<Link
					href="/"
					className="p-2 -ml-2 hover:bg-gray-800 rounded-full transition-all"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-gray-400"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</Link>
				<div className="ml-2 flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/20">
						AI
					</div>
					<div>
						<h1 className="text-sm font-bold">Asisten Dompeto</h1>
						<p className="text-[10px] text-emerald-400 flex items-center gap-1">
							<span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>{" "}
							Online
						</p>
					</div>
				</div>
			</header>

			{/* Chat Messages */}
			<div
				ref={scrollRef}
				className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
			>
				{messages.length === 0 && (
					<div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80">
						<div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center border border-gray-800 shadow-2xl">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="32"
								height="32"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-emerald-500"
							>
								<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
							</svg>
						</div>
						<div>
							<p className="font-semibold text-gray-300">
								Tanyakan apa pun tentang keuanganmu.
							</p>
							<p className="text-sm text-gray-500 mt-1">
								Gunakan salah satu saran di bawah atau ketik sendiri.
							</p>
						</div>
					</div>
				)}

				{messages.map((m, i) => (
					<div
						key={i}
						className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-sm leading-relaxed ${
								m.role === "user"
									? "bg-emerald-600 text-white rounded-tr-none"
									: "bg-gray-900 border border-gray-800 text-gray-100 rounded-tl-none"
							}`}
							style={{ whiteSpace: "pre-wrap" }}
						>
							{m.content}
						</div>
					</div>
				))}

				{loading && (
					<div className="flex justify-start">
						<div className="bg-gray-900 border border-gray-800 p-4 rounded-3xl rounded-tl-none flex gap-1 items-center shadow-sm">
							<div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></div>
							<div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
							<div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
						</div>
					</div>
				)}
			</div>

			{/* Footer / Input */}
			<footer className="p-4 bg-gray-950 space-y-4 border-t border-gray-900/50 pb-6">
				{messages.length === 0 && (
					<div className="flex flex-wrap gap-2">
						{SUGGESTIONS.map((s) => (
							<button
								key={s}
								onClick={() => sendMessage(s)}
								className="px-4 py-2 text-xs font-medium bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 hover:border-gray-700 transition-all text-gray-400 hover:text-emerald-400 active:scale-95"
							>
								{s}
							</button>
						))}
					</div>
				)}

				<form
					onSubmit={(e) => {
						e.preventDefault()
						sendMessage(input)
					}}
					className="relative flex items-center"
				>
					<input
						type="text"
						placeholder="Tanya asisten..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						disabled={loading}
						className="w-full pl-4 pr-12 py-4 bg-gray-900 border border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg text-gray-100 placeholder-gray-500 transition-all"
					/>
					<button
						type="submit"
						disabled={loading || !input.trim()}
						className={`absolute right-2 p-2 rounded-xl transition-all ${
							loading || !input.trim()
								? "opacity-30"
								: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 active:scale-90"
						}`}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="stroke-[2.5px]"
						>
							<line x1="22" y1="2" x2="11" y2="13" />
							<polyline points="22 2 15 22 11 13 2 9 22 2" />
						</svg>
					</button>
				</form>
			</footer>
		</div>
	)
}
