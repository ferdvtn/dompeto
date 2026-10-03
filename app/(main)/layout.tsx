import { BottomNav } from "@/components/bottom-nav"
import { NightNotification } from "@/components/night-notification"
export default function MainLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<main className="app-main">{children}</main>
			<BottomNav />
			<NightNotification />
		</>
	)
}
