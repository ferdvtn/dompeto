/**
 * Menghasilkan tanggal hari ini dalam format YYYY-MM-DD berdasarkan zona waktu Jakarta (WIB).
 */
export function getJakartaISODate() {
	const now = new Date()
	// Offset Jakarta adalah UTC+7
	const jakartaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
	return jakartaTime.toISOString().split("T")[0]
}
