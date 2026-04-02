"use client"

import { useQuery } from "@tanstack/react-query"

export interface ConnectedApp {
  name: string
  status: string
  connectedAt?: string
  logo?: string
}

export function useIntegrations() {
  return useQuery<ConnectedApp[]>({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/integrations")
      if (!response.ok) {
        throw new Error("Failed to fetch integrations")
      }
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export async function connectApp(appName: string) {
  const response = await fetch(`/api/proxy/integrations/connect/${appName}`)
  if (!response.ok) {
    throw new Error(`Failed to connect ${appName}`)
  }
  return response.json()
}
