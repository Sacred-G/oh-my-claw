"use client"

import { useQuery } from "@tanstack/react-query"

export interface ConnectedApp {
  id: string
  status: string
  toolkit?: {
    slug: string
  }
  authConfig?: {
    id: string
    isComposioManaged: boolean
    isDisabled: boolean
  }
  data?: Record<string, unknown>
  statusReason?: string | null
  state?: Record<string, unknown>
  isDisabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AvailableToolkit {
  slug: string
  name: string
  status: string
  meta: {
    logo: string
    description: string
    categories: Array<{
      id: string
      name: string
    }>
    tools_count: number
    triggers_count: number
    app_url?: string | null
  }
  composio_managed_auth_schemes?: string[]
  no_auth?: boolean
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
    refetchInterval: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useAvailableToolkits() {
  return useQuery<AvailableToolkit[]>({
    queryKey: ["available-toolkits"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/integrations/available")
      if (!response.ok) {
        throw new Error("Failed to fetch available toolkits")
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export async function connectApp(appName: string) {
  const response = await fetch(`/api/proxy/integrations/connect/${appName}`)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to connect ${appName}: ${errorText}`)
  }
  return response.json()
}
