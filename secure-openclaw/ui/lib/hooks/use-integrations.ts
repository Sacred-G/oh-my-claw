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
  })
}

export function useAvailableToolkits() {
  console.log('[useAvailableToolkits] Hook called')
  const result = useQuery<AvailableToolkit[]>({
    queryKey: ["available-toolkits"],
    queryFn: async () => {
      console.log('[Hook] Fetching available toolkits...')
      const response = await fetch("/api/proxy/integrations/available")
      console.log('[Hook] Response status:', response.status, response.ok)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Hook] Error response:', errorText)
        throw new Error("Failed to fetch available toolkits")
      }
      const data = await response.json()
      console.log('[Hook] Received data:', data)
      return data
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
  console.log('[useAvailableToolkits] Query result:', result)
  return result
}

export async function connectApp(appName: string) {
  console.log('[connectApp] Connecting to:', appName)
  const response = await fetch(`/api/proxy/integrations/connect/${appName}`)
  console.log('[connectApp] Response status:', response.status, response.ok)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[connectApp] Error response:', errorText)
    throw new Error(`Failed to connect ${appName}: ${errorText}`)
  }
  const data = await response.json()
  console.log('[connectApp] Response data:', data)
  return data
}
