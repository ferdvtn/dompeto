import { SignJWT, jwtVerify } from "jose"
import crypto from "crypto"

const JWT_SECRET = new TextEncoder().encode(
	process.env.APP_JWT_SECRET || "default_secret_min_32_chars_placeholder",
)
const COOKIE_NAME = "finance_session"

export async function signJwt() {
	return await new SignJWT({ sub: "user" })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("30d")
		.sign(JWT_SECRET)
}

export async function verifyJwt(token: string) {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET)
		return !!payload
	} catch {
		return false
	}
}

/**
 * Memverifikasi password menggunakan timingSafeEqual untuk mencegah serangan timing.
 */
export function verifyPassword(input: string): boolean {
	const password = process.env.APP_PASSWORD
	if (!password) return false

	const inputBuffer = Buffer.from(input)
	const passwordBuffer = Buffer.from(password)

	if (inputBuffer.length !== passwordBuffer.length) {
		return false
	}

	return crypto.timingSafeEqual(inputBuffer, passwordBuffer)
}
