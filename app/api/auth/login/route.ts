import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { signJwt, verifyPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
	try {
		const { password } = await req.json()
		const ip = req.headers.get("x-forwarded-for") || "unknown"

		// 1. Cek rate limiting di database
		const attemptsResult = await db.execute({
			sql: "SELECT count, last_attempt FROM login_attempts WHERE ip = ?",
			args: [ip],
		})

		const attempt = attemptsResult.rows[0] as unknown as
			| { count: number; last_attempt: string }
			| undefined
		if (attempt) {
			const lastAttempt = new Date(attempt.last_attempt)
			const now = new Date()
			const diffMinutes = (now.getTime() - lastAttempt.getTime()) / (1000 * 60)

			if ((attempt.count || 0) >= 5 && diffMinutes < 15) {
				return NextResponse.json(
					{ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
					{ status: 429 },
				)
			}
		}

		// 2. Verifikasi password
		const isValid = verifyPassword(password)

		if (!isValid) {
			// Upsert percobaan login
			await db.execute({
				sql: `
          INSERT INTO login_attempts (ip, count, last_attempt)
          VALUES (?, 1, datetime('now', 'localtime'))
          ON CONFLICT(ip) DO UPDATE SET
            count = CASE WHEN (strftime('%s', 'now', 'localtime') - strftime('%s', last_attempt)) > 900 THEN 1 ELSE count + 1 END,
            last_attempt = datetime('now', 'localtime')
        `,
				args: [ip],
			})

			return NextResponse.json({ error: "Password salah." }, { status: 401 })
		}

		// 3. Sukses: Hapus percobaan login dan berikan JWT
		await db.execute({
			sql: "DELETE FROM login_attempts WHERE ip = ?",
			args: [ip],
		})

		const token = await signJwt()
		const response = NextResponse.json({ success: true })

		// Set cookie
		response.headers.set(
			"Set-Cookie",
			`finance_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`,
		)

		return response
	} catch (error) {
		console.error("Login API Error:", error)
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal." },
			{ status: 500 },
		)
	}
}
