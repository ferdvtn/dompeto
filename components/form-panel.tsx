"use client"
import { Dialog } from "@base-ui/react/dialog"
import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
export function FormPanel({
	open,
	onClose,
	title,
	children,
	footer,
}: {
	open: boolean
	onClose: () => void
	title: string
	children: ReactNode
	footer?: ReactNode
}) {
	useEffect(() => {
		if (!open) return
		document.body.dataset.panel = "true"
		return () => {
			delete document.body.dataset.panel
		}
	}, [open])
	return (
		<Dialog.Root
			open={open}
			onOpenChange={(value) => {
				if (!value) onClose()
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="form-backdrop" />
				<Dialog.Popup className="form-panel" initialFocus={true}>
					<header className="panel-header row between">
						<Dialog.Title className="text-lg font-semibold">
							{title}
						</Dialog.Title>
						<button
							type="button"
							className="icon-btn"
							onClick={onClose}
							aria-label="Tutup panel"
						>
							<X size={22} />
						</button>
					</header>
					<div className="panel-body">{children}</div>
					{footer && <footer className="panel-footer">{footer}</footer>}
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
