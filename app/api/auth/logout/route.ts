import { NextResponse } from "next/server"

export async function POST() {
	const response = NextResponse.json({ success: true })

	// Hapus cookie dengan Max-Age=0
	response.headers.set(
		"Set-Cookie",
		`finance_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
	)

	return response
}
