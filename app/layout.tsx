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

import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="id" className={cn("font-sans overflow-x-hidden", geist.variable)}>
			<body
				className={`${inter.className} bg-[#02030a] text-slate-100 antialiased flex justify-center overflow-x-hidden`}
			>
				<div className="w-full max-w-md bg-[#020617] min-h-svh shadow-2xl relative border-x border-white/5 flex flex-col">
					{children}
					<Toaster richColors position="top-center" />
				</div>
			</body>
		</html>
	)
}
