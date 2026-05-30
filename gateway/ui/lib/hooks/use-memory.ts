"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface MemoryContent {
  content: string
}

export interface SearchMatch {
  line: number
  context: string
}

export interface SearchResult {
  file: string
  matches: SearchMatch[]
}

export function useLongTermMemory() {
  return useQuery<MemoryContent>({
    queryKey: ["memory", "long-term"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/memory/long-term")
      if (!response.ok) {
        throw new Error("Failed to fetch long-term memory")
      }
      return response.json()
    },
  })
}

export function useDailyMemoryFiles() {
  return useQuery<string[]>({
    queryKey: ["memory", "daily-files"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/memory/daily")
      if (!response.ok) {
        throw new Error("Failed to fetch daily memory files")
      }
      return response.json()
    },
  })
}

export function useDailyMemory(date: string) {
  return useQuery<MemoryContent>({
    queryKey: ["memory", "daily", date],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/memory/daily/${date}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch daily memory for ${date}`)
      }
      return response.json()
    },
    enabled: !!date,
  })
}

export function useMemorySearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["memory", "search", query],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/memory/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error("Failed to search memory")
      }
      return response.json()
    },
    enabled: !!query && query.length >= 2,
  })
}

export function useUpdateMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      type,
      date,
      content,
    }: {
      type: "long-term" | "daily"
      date?: string
      content: string
    }) => {
      const response = await fetch("/api/proxy/memory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, date, content }),
      })

      if (!response.ok) {
        throw new Error("Failed to update memory")
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      if (variables.type === "long-term") {
        queryClient.invalidateQueries({ queryKey: ["memory", "long-term"] })
      } else {
        queryClient.invalidateQueries({ queryKey: ["memory", "daily", variables.date] })
      }
    },
  })
}
