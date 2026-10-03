"use client"
import { useEffect } from "react"
export function ViewportManager() {
	useEffect(() => {
		const viewport = window.visualViewport
		let frame = 0
		const update = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				const zoomed = viewport && Math.abs(viewport.scale - 1) > 0.05
				const height = zoomed
					? window.innerHeight
					: (viewport?.height ?? window.innerHeight)
				const top = zoomed ? 0 : (viewport?.offsetTop ?? 0)
				document.documentElement.style.setProperty(
					"--visible-height",
					`${height}px`,
				)
				document.documentElement.style.setProperty("--visible-top", `${top}px`)
				const active = document.activeElement as HTMLElement | null
				const editable = active?.matches(
					"input:not([type=checkbox]):not([type=file]),textarea,[contenteditable=true]",
				)
				const keyboard =
					!zoomed && !!editable && window.innerHeight - height > 120
				document.body.dataset.keyboard = String(keyboard)
				const scroller = active?.closest(".panel-body")
				if (keyboard && active && scroller) {
					const rect = active.getBoundingClientRect(),
						bounds = scroller.getBoundingClientRect()
					if (rect.bottom > bounds.bottom - 16)
						scroller.scrollTop += rect.bottom - bounds.bottom + 16
					else if (rect.top < bounds.top + 16)
						scroller.scrollTop -= bounds.top + 16 - rect.top
				}
			})
		}
		update()
		viewport?.addEventListener("resize", update)
		viewport?.addEventListener("scroll", update)
		window.addEventListener("resize", update)
		document.addEventListener("focusin", update)
		document.addEventListener("focusout", update)
		return () => {
			cancelAnimationFrame(frame)
			viewport?.removeEventListener("resize", update)
			viewport?.removeEventListener("scroll", update)
			window.removeEventListener("resize", update)
			document.removeEventListener("focusin", update)
			document.removeEventListener("focusout", update)
			delete document.body.dataset.keyboard
			document.documentElement.style.removeProperty("--visible-height")
			document.documentElement.style.removeProperty("--visible-top")
		}
	}, [])
	return null
}
