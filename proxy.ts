import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = ["/login", "/api/auth/login"]

export async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl

	// Izinkan akses ke jalur publik
	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
		return NextResponse.next()
	}

	// Ambil token dari cookie
	const token = req.cookies.get("finance_session")?.value

	if (!token) {
		return NextResponse.redirect(new URL("/login", req.url))
	}

	try {
		const secret = new TextEncoder().encode(
			process.env.APP_JWT_SECRET || "default_secret_min_32_chars_placeholder",
		)
		await jwtVerify(token, secret)
		return NextResponse.next()
	} catch (error) {
		// Token tidak valid atau kadaluwarsa
		return NextResponse.redirect(new URL("/login", req.url))
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
}
