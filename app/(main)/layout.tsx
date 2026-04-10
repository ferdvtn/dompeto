import { BottomNav } from "@/components/bottom-nav"
import { NightNotification } from "@/components/night-notification"

export default function MainLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col">
			<main className="flex-1 pb-20 overflow-x-hidden">{children}</main>
			<BottomNav />
			<NightNotification />
		</div>
	)
}
