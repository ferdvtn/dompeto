"use client"

import { Calendar, Tag, FileText, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer"

interface TransactionDetailDrawerProps {
	transaction: any
	onClose: () => void
	onDelete: (id: number) => void
}

export function TransactionDetailDrawer({
	transaction,
	onClose,
	onDelete,
}: TransactionDetailDrawerProps) {
	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount)
	}

	return (
		<Drawer open={!!transaction} onOpenChange={(o) => !o && onClose()}>
			<DrawerContent className="rounded-t-[2rem] bg-[#020617] border-t border-white/5 p-6 pb-12 outline-none">
				<div className="mx-auto w-10 h-1 bg-slate-800 rounded-full mb-6" />
				{transaction && (
					<div className="space-y-8">
						<DrawerHeader className="p-0 text-left">
							<div className="flex justify-between items-start mb-4">
								<Badge
									className={cn(
										"px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
										transaction.type === "income"
											? "bg-emerald-500/10 text-emerald-400"
											: "bg-red-500/10 text-red-400",
									)}
								>
									{transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
								</Badge>
								<span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
									<Calendar className="w-3.5 h-3.5" />
									{new Date(transaction.created_at).toLocaleDateString("id", {
										day: "2-digit",
										month: "long",
										year: "numeric",
									})}
								</span>
							</div>
							<DrawerTitle className="text-xl font-black italic text-slate-100 break-words leading-tight">
								{transaction.description || transaction.raw_input}
							</DrawerTitle>
							<div className="text-2xl font-black italic mt-1 text-slate-200">
								{transaction.type === "expense" ? "-" : "+"}{" "}
								{formatIDR(transaction.amount)}
							</div>
						</DrawerHeader>

						<div className="grid grid-cols-1 gap-3">
							<div className="p-3.5 bg-slate-900/40 rounded-2xl space-y-1 shadow-inner border border-white/5">
								<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
									<Info className="w-3 h-3" /> Input Asli
								</div>
								<div className="text-[13px] font-bold italic text-slate-300">
									"{transaction.raw_input}"
								</div>
							</div>

							<div className="flex gap-3">
								<div className="flex-1 p-3.5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-1 shadow-sm">
									<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Tag className="w-3 h-3" /> Kategori
									</div>
									<div className="text-[13px] font-black italic text-slate-200">
										{transaction.category_name}
									</div>
								</div>
								<div className="flex-1 p-3.5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-1 shadow-sm">
									<div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<FileText className="w-3 h-3" /> Catatan
									</div>
									<div className="text-[13px] font-bold italic text-slate-400">
										{transaction.notes || "-"}
									</div>
								</div>
							</div>
						</div>

						<DrawerFooter className="p-0 pt-4 flex-row gap-3">
							<Button
								variant="outline"
								className="flex-1 h-11 rounded-xl border-white/10 text-slate-500 font-black uppercase tracking-widest text-[9px] bg-slate-900/20"
								onClick={onClose}
							>
								Tutup
							</Button>
							<Button
								variant="destructive"
								className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-red-950/20 border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
								onClick={() => onDelete(transaction.id)}
							>
								Hapus
							</Button>
						</DrawerFooter>
					</div>
				)}
			</DrawerContent>
		</Drawer>
	)
}
