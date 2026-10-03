import { NextResponse } from "next/server"
import { scanReceipt } from "@/lib/ai"

export async function POST(request: Request) {
	try {
		const { image } = await request.json()
		if (!image) {
			return NextResponse.json({ error: "No image provided" }, { status: 400 })
		}

		// Call AI to scan receipt
		const scanResult = await scanReceipt(image)

		// Return the results for confirmation (No DB insert yet)
		return NextResponse.json({ scanResult })
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Gagal membaca struk" },
			{ status: 500 },
		)
	}
}
