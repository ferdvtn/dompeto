import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const inter = Inter({ subsets: ["latin"] })

export const viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
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
		<html lang="id" className={cn("font-sans overflow-x-hidden", geist.variable)}>
			<body
				className={`${inter.className} bg-[#020617] text-slate-100 antialiased flex justify-center overflow-x-hidden`}
			>
				<div className="w-full max-w-md bg-[#0f172a] min-h-svh shadow-2xl relative border-x border-white/5 flex flex-col">
					{children}
					<Toaster richColors position="top-center" />
				</div>
			</body>
		</html>
	)
}
