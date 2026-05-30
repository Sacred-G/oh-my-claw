import { useQuery } from "@tanstack/react-query"

export interface GatewayStats {
  sessions: {
    total: number
    active: number
  }
  adapters: {
    total: number
    connected: number
    details: Record<string, { connected: boolean }>
  }
  queue: {
    pending: number
    active: number
  }
  memory: {
    topics: number
  }
}

export function useDashboardStats() {
  return useQuery<GatewayStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }
      return response.json()
    },
    refetchInterval: 5000, // Poll every 5 seconds
  })
}
