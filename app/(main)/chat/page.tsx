"use client"
import { useEffect, useRef, useState } from "react"
import { Send, Sparkles, ArrowDown } from "lucide-react"
import { PageHeader } from "@/components/page-ui"
import { api, jsonBody, errorMessage } from "@/lib/client-api"
type Message = { role: "user" | "assistant"; content: string }
export default function ChatPage() {
	const [messages, setMessages] = useState<Message[]>([]),
		[input, setInput] = useState(""),
		[busy, setBusy] = useState(false),
		[error, setError] = useState(""),
		[failed, setFailed] = useState("")
	const [ready, setReady] = useState(false),
		[unread, setUnread] = useState(false)
	const list = useRef<HTMLDivElement>(null),
		nearBottom = useRef(true)
	useEffect(() => {
		queueMicrotask(() => {
			try {
				const saved = JSON.parse(
					localStorage.getItem("dompeto_chat_history") || "[]",
				)
				if (Array.isArray(saved))
					setMessages(
						saved.filter(
							(m) =>
								typeof m.content === "string" &&
								(m.role === "user" || m.role === "assistant"),
						),
					)
			} catch {}
			setReady(true)
		})
	}, [])
	useEffect(() => {
		if (!ready) return
		try {
			localStorage.setItem(
				"dompeto_chat_history",
				JSON.stringify(messages.slice(-50)),
			)
		} catch {}
		if (nearBottom.current)
			list.current?.scrollTo({ top: list.current.scrollHeight })
		else queueMicrotask(() => setUnread(true))
	}, [messages, ready])
	const latest = () => {
		nearBottom.current = true
		setUnread(false)
		list.current?.scrollTo({ top: list.current.scrollHeight })
	}
	const send = async (retry = false) => {
		const text = retry ? failed : input.trim()
		if (!text || busy) return
		setBusy(true)
		setError("")
		setFailed("")
		if (!retry) {
			setMessages((m) => [...m, { role: "user", content: text }])
			setInput("")
			nearBottom.current = true
		}
		try {
			const data = await api<{ reply: string }>(
				"/api/chat",
				jsonBody({ message: text }),
			)
			if (!data.reply)
				throw new Error("AI belum memberikan jawaban. Coba lagi.")
			setMessages((m) => [...m, { role: "assistant", content: data.reply }])
		} catch (e) {
			setError(errorMessage(e))
			setFailed(text)
		} finally {
			setBusy(false)
		}
	}
	return (
		<div className="chat-page">
			<div className="panel-header">
				<PageHeader
					title="Asisten AI"
					subtitle="Tanyakan tentang catatan keuanganmu."
				/>
			</div>
			<div
				className="chat-body"
				ref={list}
				onScroll={() => {
					const el = list.current
					if (el) {
						nearBottom.current =
							el.scrollHeight - el.scrollTop - el.clientHeight < 80
						if (nearBottom.current) setUnread(false)
					}
				}}
			>
				{!messages.length && (
					<div className="card mt-6">
						<Sparkles className="text-primary mb-4" />
						<h2>Apa yang ingin kamu ketahui?</h2>
						<p className="muted mt-2">
							Lihat rekap belanja, pemasukan, atau sisa anggaran dari catatanmu.
						</p>
					</div>
				)}
				{messages.map((m, i) => (
					<article key={i} className={`bubble ${m.role}`}>
						<p className="text-xs muted mb-2">
							{m.role === "user" ? "Kamu" : "Dompeto"}
						</p>
						{m.content}
					</article>
				))}
				{busy && (
					<p role="status" className="muted">
						Menyiapkan jawaban…
					</p>
				)}
				{error && (
					<div className="card error" role="alert">
						<p>{error}</p>
						<button
							className="btn mt-3"
							disabled={busy}
							onClick={() => send(true)}
						>
							Coba lagi
						</button>
					</div>
				)}
			</div>
			{unread && (
				<button className="btn mx-auto mb-2" onClick={latest}>
					<ArrowDown size={16} />
					Pesan terbaru
				</button>
			)}
			<div className="chat-composer">
				<div className="suggestions flex gap-2 overflow-x-auto pb-3">
					{[
						"Rekap pengeluaran hari ini",
						"Sisa anggaran saya?",
						"Total pemasukan bulan ini",
					].map((text) => (
						<button
							key={text}
							className="btn shrink-0"
							onClick={() => setInput(text)}
						>
							{text}
						</button>
					))}
				</div>
				<form
					className="row"
					onSubmit={(e) => {
						e.preventDefault()
						void send()
					}}
				>
					<label className="sr-only" htmlFor="chat-input">
						Pesan untuk AI
					</label>
					<input
						id="chat-input"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Tulis pertanyaan…"
						maxLength={2000}
					/>
					<button
						className="btn primary"
						aria-label="Kirim pesan"
						disabled={busy || !input.trim()}
					>
						<Send size={20} />
					</button>
				</form>
			</div>
		</div>
	)
}
