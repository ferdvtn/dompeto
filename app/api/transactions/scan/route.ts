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
	} catch (error: any) {
		return NextResponse.json(
			{ error: error.message || "Failed to scan receipt" },
			{ status: 500 },
		)
	}
}
