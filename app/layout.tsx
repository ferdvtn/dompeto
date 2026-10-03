import { ViewportManager } from "@/components/viewport-manager"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: "#141817",
}

export const metadata: Metadata = {
	title: "Dompeto",
	description: "Pelacak keuangan pribadi bertenaga AI",
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
	},
	manifest: "/site.webmanifest",
}

import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="id" className={cn("dark", geist.variable)}>
			<body>
				<ViewportManager />
				{children}
				<Toaster position="top-center" />
			</body>
		</html>
	)
}
