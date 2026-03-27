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
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="id" className={cn("font-sans dark", geist.variable)}>
			<body
				className={`${inter.className} bg-black text-gray-100 min-h-screen antialiased flex justify-center`}
			>
				<div className="w-full max-w-md bg-gray-950 min-h-screen shadow-2xl shadow-emerald-950/20 relative">
					{children}
				</div>
			</body>
		</html>
	)
}
