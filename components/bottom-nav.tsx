"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
	Home,
	PieChart,
	LayoutGrid,
	Settings,
	MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
	{ label: "Home", href: "/", icon: Home },
	{ label: "Grafik", href: "/charts", icon: PieChart },
	{ label: "AI Chat", href: "/chat", icon: MessageSquare },
	{ label: "Kategori", href: "/categories", icon: LayoutGrid },
	{ label: "Setelan", href: "/settings", icon: Settings },
]

export function BottomNav() {
	const pathname = usePathname()

	return (
		<nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-900/80 backdrop-blur-lg border-t border-gray-800 pb-safe-area-inset-bottom z-50">
			<div className="flex justify-around items-center h-16 max-w-md mx-auto">
				{NAV_ITEMS.map((item) => {
					const isActive = pathname === item.href
					const Icon = item.icon

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
								isActive ? "text-emerald-400" : "text-gray-400 hover:text-gray-200",
							)}
						>
							<Icon className="w-5 h-5" />
							<span className="text-[10px] font-medium">{item.label}</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
