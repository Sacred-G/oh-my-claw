"use client"

import { useEffect, useState } from "react"

export function useEventSource<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data)
        setData(parsedData)
      } catch (err) {
        console.error("Failed to parse SSE message:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err)
      setError(new Error("EventSource failed"))
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [url])

  return { data, error }
}
