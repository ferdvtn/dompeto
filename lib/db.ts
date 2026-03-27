import { createClient } from "@libsql/client"

const url =
	process.env.TURSO_DATABASE_URL || "libsql://build-placeholder.turso.io"
const authToken = process.env.TURSO_AUTH_TOKEN || "placeholder"

export const db = createClient({
	url,
	authToken,
})
