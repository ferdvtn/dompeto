import crypto from "crypto"
export { signJwt, verifyJwt } from "./jwt"

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
