"use client"

import { useQuery } from "@tanstack/react-query"

export interface ScheduledJob {
  jobId: string
  platform: string
  chatId: string
  message: string
  cronExpression: string
  invokeAgent: boolean
  lastRun?: number
  nextRun?: number
}

export function useScheduling() {
  return useQuery<ScheduledJob[]>({
    queryKey: ["scheduling-jobs"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/scheduling/jobs")
      if (!response.ok) {
        throw new Error("Failed to fetch scheduled jobs")
      }
      return response.json()
    },
    refetchInterval: 30000,
  })
}
