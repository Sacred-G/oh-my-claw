import { useQuery } from "@tanstack/react-query"

export interface TranscriptMessage {
  role: "user" | "assistant"
  content: string
  timestamp: number
  hasImage?: boolean
}

export interface SessionInfo {
  key: string
  lastActivity: number
  transcriptCount: number
  lastRunId: string | null
}

export interface SessionDetail extends SessionInfo {
  transcript: TranscriptMessage[]
}

export function useSessions() {
  return useQuery<SessionInfo[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/sessions")
      if (!response.ok) {
        throw new Error("Failed to fetch sessions")
      }
      return response.json()
    },
    refetchInterval: 10000, // Poll every 10 seconds
  })
}

export function useSessionDetail(sessionKey: string) {
  return useQuery<SessionDetail>({
    queryKey: ["session", sessionKey],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/sessions/${sessionKey}`)
      if (!response.ok) {
        throw new Error("Failed to fetch session details")
      }
      return response.json()
    },
    enabled: !!sessionKey,
    refetchInterval: 5000,
  })
}
