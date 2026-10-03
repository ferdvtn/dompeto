"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/client-api"
export function useResource<T>(url: string) {
	const [result, setResult] = useState<{
		url: string
		data?: T
		error?: boolean
	}>({ url: "" })
	const [version, setVersion] = useState(0)
	useEffect(() => {
		const controller = new AbortController()
		api<T>(url, { signal: controller.signal })
			.then((data) => {
				if (!controller.signal.aborted) setResult({ url, data })
			})
			.catch(() => {
				if (!controller.signal.aborted) setResult({ url, error: true })
			})
		return () => controller.abort()
	}, [url, version])
	return {
		data: result.url === url ? result.data : undefined,
		error: result.url === url && result.error,
		reload: () => {
			setResult({ url: "" })
			setVersion((v) => v + 1)
		},
	}
}
