import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
	process.env.APP_JWT_SECRET || "default_secret_min_32_chars_placeholder",
)

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
