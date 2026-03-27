"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Tag, ChevronRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

export default function CategoriesPage() {
	const [categories, setCategories] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState("")
	const [isAddOpen, setIsAddOpen] = useState(false)
	const [newCat, setNewCat] = useState({ name: "", type: "expense", icon: "📂" })
	const [adding, setAdding] = useState(false)

	const fetchCategories = () => {
		fetch("/api/categories")
			.then((res) => res.json())
			.then((data) => {
				setCategories(data)
				setLoading(false)
			})
	}

	useEffect(() => {
		fetchCategories()
	}, [])

	const handleAddCategory = async () => {
		if (!newCat.name.trim()) return
		setAdding(true)
		try {
			const res = await fetch("/api/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newCat),
			})
			if (!res.ok) throw new Error("Gagal menambah kategori")
			toast.success("Kategori baru ditambahkan")
			setIsAddOpen(false)
			setNewCat({ name: "", type: "expense", icon: "📂" })
			fetchCategories()
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			setAdding(false)
		}
	}

	const filteredCategories = categories.filter((c) =>
		c.name.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	if (loading) {
		return (
			<div className="p-4 space-y-4">
				<Skeleton className="h-12 w-full rounded-2xl" />
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-16 w-full rounded-2xl" />
				))}
			</div>
		)
	}

	return (
		<div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-black italic">Kategori</h1>

				<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
					<DialogTrigger
						render={
							<Button
								size="icon"
								variant="ghost"
								className="rounded-full bg-gray-900 border border-gray-800"
							>
								<Plus className="w-5 h-5 text-cyan-400" />
							</Button>
						}
					/>
					<DialogContent className="rounded-t-3xl bg-gray-950 border-gray-800 p-6 sm:max-w-md mx-auto">
						<DialogHeader>
							<DialogTitle className="text-xl font-bold italic flex items-center gap-2">
								<Tag className="w-5 h-5 text-cyan-400" /> Tambah Kategori
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-6 py-4">
							<div className="space-y-2">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
									Nama Kategori
								</Label>
								<Input
									placeholder="Contoh: Hiburan, Kopi, dsb."
									className="bg-gray-900 border-gray-800 h-14 rounded-2xl text-lg font-bold"
									value={newCat.name}
									onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
									Tipe Transaksi
								</Label>
								<Select
									value={newCat.type}
									onValueChange={(v: string | null) =>
										setNewCat({ ...newCat, type: v || "expense" })
									}
								>
									<SelectTrigger className="bg-gray-900 border-gray-800 h-14 rounded-2xl">
										<SelectValue placeholder="Pilih Tipe" />
									</SelectTrigger>
									<SelectContent className="bg-gray-900 border-gray-800 rounded-xl">
										<SelectItem value="expense">Pengeluaran</SelectItem>
										<SelectItem value="income">Pemasukan</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Button
								className="w-full h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-600 font-bold text-lg shadow-lg shadow-cyan-500/20"
								onClick={handleAddCategory}
								disabled={adding || !newCat.name.trim()}
							>
								{adding ? (
									<Loader2 className="w-5 h-5 animate-spin mr-2" />
								) : (
									<Plus className="w-5 h-5 mr-2" />
								)}
								Simpan Kategori
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
				<Input
					placeholder="Cari kategori..."
					className="pl-9 bg-gray-900 border-gray-800 rounded-2xl h-12 text-sm focus-visible:ring-emerald-500"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<div className="space-y-3">
				{filteredCategories.map((cat) => (
					<div
						key={cat.id}
						className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-3xl active:scale-[0.98] transition-transform shadow-lg"
					>
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-xl shadow-inner font-black text-gray-600 uppercase">
								{cat.icon || cat.name.substring(0, 1)}
							</div>
							<div>
								<div className="text-sm font-bold text-gray-100 italic">{cat.name}</div>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className={cn(
											"text-[8px] px-1.5 py-0 rounded-full font-bold uppercase tracking-tighter",
											cat.type === "income"
												? "border-emerald-500/50 text-emerald-400"
												: "border-red-500/50 text-red-400",
										)}
									>
										{cat.type}
									</Badge>
									{cat.monthly_budget > 0 && (
										<span className="text-[9px] text-gray-500 font-bold uppercase italic">
											Budget: {new Intl.NumberFormat("id-ID").format(cat.monthly_budget)}
										</span>
									)}
								</div>
							</div>
						</div>
						<ChevronRight className="w-4 h-4 text-gray-700" />
					</div>
				))}
			</div>
		</div>
	)
}
