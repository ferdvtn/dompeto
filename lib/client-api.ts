export async function api<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init)
	const data = await response.json()
	if (!response.ok)
		throw new Error(data.error || "Permintaan gagal. Coba lagi.")
	return data as T
}
export function jsonBody(data: unknown, method = "POST"): RequestInit {
	return {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	}
}
export const errorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi."
