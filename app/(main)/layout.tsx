"use client"

import { BottomNav } from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/sonner"

export default function MainLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col min-h-screen">
			<main className="flex-1 pb-20 overflow-x-hidden">{children}</main>
			<BottomNav />
			<Toaster richColors position="top-center" />
		</div>
	)
}
