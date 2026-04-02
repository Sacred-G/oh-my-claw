"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, MessageSquare, Blocks, Loader2 } from "lucide-react"
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats"

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4 text-center">
        <p className="text-destructive font-medium">Failed to connect to gateway</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Make sure the secure-openclaw gateway is running on {process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001"}.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground">
          Here is what&apos;s happening with your AI agent.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
            <Activity className={stats?.adapters.connected ? "h-4 w-4 text-green-500" : "h-4 w-4 text-muted-foreground"} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.adapters.connected ? "Online" : "Offline"}
            </div>
            <p className="text-xs text-muted-foreground">
              Connected to {stats?.adapters.connected} of {stats?.adapters.total} platforms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sessions.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sessions.active} active in last hour
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue</CardTitle>
            <Loader2 className={stats?.queue.pending ? "h-4 w-4 animate-spin text-blue-500" : "h-4 w-4 text-muted-foreground"} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.queue.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.queue.active} currently processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <Blocks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Composio connected
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your agent has been busy lately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground">
              <p>No recent activity logged yet.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Adapter Details</CardTitle>
            <CardDescription>
              Connection status per platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {stats && Object.entries(stats.adapters.details).map(([name, detail]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="capitalize font-medium">{name}</span>
                <span className={detail.connected ? "text-green-500 text-sm" : "text-muted-foreground text-sm"}>
                  {detail.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            ))}
            {stats?.adapters.total === 0 && (
              <p className="text-sm text-muted-foreground">No adapters configured.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
