/**
 * Memproses string mata uang informal Indonesia menjadi integer Rupiah.
 * Contoh: "10k" -> 10000, "1.5jt" -> 1500000, "250rb" -> 250000.
 */
export function parseRupiah(input: string): number | null {
	if (!input) return null

	// 1. Lowercase dan bersihkan spasi
	let str = input.toLowerCase().replace(/\s+/g, "")

	// 2. Deteksi suffix
	let multiplier = 1
	if (str.endsWith("k") || str.endsWith("rb") || str.endsWith("ribu")) {
		multiplier = 1000
		str = str.replace(/(k|rb|ribu)$/, "")
	} else if (str.endsWith("jt") || str.endsWith("juta")) {
		multiplier = 1000000
		str = str.replace(/(jt|juta)$/, "")
	}

	// 3. Bersihkan karakter non-numerik kecuali separator desimal
	// Kita anggap '.' atau ',' sebagai separator desimal jia berada di tengah angka
	// Tapi dalam format Indonesia, '.' sering jadi ribuan.
	// Strategi: hapus semua '.' kecuali jika itu satu-satunya titik dan ada di akhir (desimal)
	// Tapi untuk "1.5jt", titik adalah desimal.

	// Normalisasi: ganti ',' dengan '.' agar treat as decimal
	str = str.replace(/,/g, ".")

	// Jika ada lebih dari satu titik, anggap yang sebelum terakhir adalah ribuan
	const parts = str.split(".")
	if (parts.length > 2) {
		// Gabungkan kembali bagian ribuan, sisakan satu titik terakhir sebagai desimal
		const decimal = parts.pop()
		str = parts.join("") + "." + decimal
	}

	const num = parseFloat(str)
	if (isNaN(num)) return null

	return Math.round(num * multiplier)
}
