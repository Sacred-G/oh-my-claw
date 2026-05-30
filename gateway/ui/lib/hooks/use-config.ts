"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface Config {
  agentId: string
  whatsapp: {
    enabled: boolean
    allowedDMs: string[]
    allowedGroups: string[]
    respondToMentionsOnly: boolean
  }
  imessage: {
    enabled: boolean
    allowedDMs: string[]
    allowedGroups: string[]
    respondToMentionsOnly: boolean
  }
  telegram: {
    enabled: boolean
    token: string
    allowedDMs: string[]
    allowedGroups: string[]
    respondToMentionsOnly: boolean
  }
  signal: {
    enabled: boolean
    phoneNumber: string
    signalCliPath: string
    allowedDMs: string[]
    allowedGroups: string[]
    respondToMentionsOnly: boolean
  }
  agent: {
    workspace: string
    maxTurns: number
    allowedTools: string[]
    provider: string
    opencode: {
      model: string
      hostname: string
      port: number
    }
  }
}

export function useConfig() {
  return useQuery<Config>({
    queryKey: ["config"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/config")
      if (!response.ok) {
        throw new Error("Failed to fetch config")
      }
      return response.json()
    },
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newConfig: Partial<Config>) => {
      const response = await fetch("/api/proxy/config/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      })

      if (!response.ok) {
        throw new Error("Failed to update config")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] })
    },
  })
}
