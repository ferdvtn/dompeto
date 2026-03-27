import { BottomNav } from "@/components/bottom-nav"

export default function MainLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col min-h-screen">
			<main className="flex-1 pb-20 overflow-x-hidden">{children}</main>
			<BottomNav />
		</div>
	)
}
