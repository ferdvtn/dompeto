import { NextRequest, NextResponse } from "next/server"
import { verifyJwt } from "./lib/jwt"

export async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl

	// 1. Cek token dari cookie
	const token = req.cookies.get("finance_session")?.value
	const isValid = token ? await verifyJwt(token) : false

	// 2. Jika di halaman login tapi sudah login, redirect ke home
	if (pathname === "/login" && isValid) {
		return NextResponse.redirect(new URL("/", req.url))
	}

	// 3. Izinkan akses ke jalur publik lainnya (misal: API login)
	if (pathname.startsWith("/api/auth/login")) {
		return NextResponse.next()
	}

	// 4. Proteksi rute terproteksi: Jika belum login, redirect ke login
	if (!isValid && pathname !== "/login") {
		return NextResponse.redirect(new URL("/login", req.url))
	}

	return NextResponse.next()
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
