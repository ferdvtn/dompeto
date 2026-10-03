"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
	House,
	List,
	ChartNoAxesCombined,
	Sparkles,
	Settings,
	Wallet,
} from "lucide-react"
const links = [
	{ href: "/", label: "Beranda", icon: House },
	{ href: "/transactions", label: "Transaksi", icon: List },
	{ href: "/charts", label: "Grafik", icon: ChartNoAxesCombined },
	{ href: "/chat", label: "AI", icon: Sparkles },
]
export function BottomNav() {
	const path = usePathname()
	return (
		<nav className="app-nav" aria-label="Navigasi utama">
			<Link className="nav-brand" href="/">
				<Wallet />
				Dompeto
			</Link>
			{links.map(({ href, label, icon: Icon }) => (
				<Link
					key={href}
					href={href}
					aria-current={path === href ? "page" : undefined}
				>
					<Icon size={22} />
					<span>{label}</span>
				</Link>
			))}
			<Link
				className="desktop-settings"
				href="/settings"
				aria-current={path === "/settings" ? "page" : undefined}
			>
				<Settings size={22} />
				Pengaturan
			</Link>
		</nav>
	)
}
