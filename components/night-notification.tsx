"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function NightNotification() {
	useEffect(() => {
		// 1. Request Browser Notification Permission
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission()
		}

		const checkAndNotify = async () => {
			const now = new Date()
			// Jakarta offset is UTC+7
			const jakartaTime = new Date(
				now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 60 * 60 * 1000,
			)
			const hour = jakartaTime.getHours()
			const todayStr = jakartaTime.toISOString().split("T")[0]

			// Trigger only at night (e.g., 21:00 or later)
			if (hour >= 21) {
				const lastNotifDate = localStorage.getItem("last_night_notif_date")

				// Only notify once per day
				if (lastNotifDate !== todayStr) {
					try {
						const res = await fetch("/api/stats/dashboard")
						const data = await res.json()

						if (data && data.spentToday !== undefined) {
							const amountStr = new Intl.NumberFormat("id-ID", {
								style: "currency",
								currency: "IDR",
								maximumFractionDigits: 0,
							}).format(data.spentToday)

							const title = "Ringkasan Hari Ini"
							const message = `Hari ini kamu sudah belanja ${amountStr}. Jangan lupa catat semua ya!`

							// Store that we've notified today
							localStorage.setItem("last_night_notif_date", todayStr)

							// Show Browser Notification if permitted
							if ("Notification" in window && Notification.permission === "granted") {
								new Notification(title, {
									body: message,
									icon: "/icon-192x192.png", // Fallback if icon exists
								})
							}

							// Always show in-app toast for visibility
							toast.info(title, {
								description: message,
								duration: 10000,
							})
						}
					} catch (error) {
						console.error("Failed to trigger night notification:", error)
					}
				}
			}
		}

		// Run check on mount and then every 30 minutes
		checkAndNotify()
		const interval = setInterval(checkAndNotify, 30 * 60 * 1000)

		return () => clearInterval(interval)
	}, [])

	return null
}
