"use client"

import { useState } from "react"
import { useIntegrations, connectApp } from "@/lib/hooks/use-integrations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Blocks, ExternalLink, CheckCircle2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

const AVAILABLE_APPS = [
  { name: "github", description: "Manage repositories, issues, and pull requests.", category: "Development" },
  { name: "google-calendar", description: "Manage events and schedules.", category: "Productivity" },
  { name: "slack", description: "Send and receive messages in Slack channels.", category: "Communication" },
  { name: "discord", description: "Interact with Discord servers and users.", category: "Communication" },
  { name: "notion", description: "Read and write to Notion pages and databases.", category: "Productivity" },
  { name: "gmail", description: "Read, send, and manage emails.", category: "Communication" },
]

export default function IntegrationsPage() {
  const { data: connectedApps, isLoading } = useIntegrations()
  const [connectingApp, setConnectingApp] = useState<string | null>(null)

  const handleConnect = async (appName: string) => {
    setConnectingApp(appName)
    try {
      const { redirectUrl } = await connectApp(appName)
      if (redirectUrl) {
        window.open(redirectUrl, "_blank")
        toast.info(`Please complete the connection for ${appName} in the new window.`)
      }
    } catch {
      toast.error(`Failed to initiate connection for ${appName}`)
    } finally {
      setConnectingApp(null)
    }
  }

  const isConnected = (appName: string) => {
    return connectedApps?.some((app) => app.name.toLowerCase() === appName.toLowerCase())
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Composio Integrations</h2>
        <p className="text-muted-foreground">
          Manage third-party tool connections for your AI agent.
        </p>
      </div>

      <div className="grid gap-6">
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Connected Apps
          </h3>
          {isLoading ? (
            <div className="flex py-10 justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !connectedApps || connectedApps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Blocks className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">No apps connected yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connectedApps.map((app) => (
                <Card key={app.name} className="overflow-hidden border-green-500/20 bg-green-500/5">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">{app.name.replace("-", " ")}</CardTitle>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Connected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 text-sm text-muted-foreground">
                    Active and ready for tool usage.
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Available Integrations
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_APPS.map((app) => {
              const connected = isConnected(app.name)
              return (
                <Card key={app.name} className={connected ? "opacity-60" : ""}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">{app.name.replace("-", " ")}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {app.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs line-clamp-2">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button
                      variant={connected ? "outline" : "default"}
                      size="sm"
                      className="w-full gap-2"
                      disabled={connected || connectingApp === app.name}
                      onClick={() => handleConnect(app.name)}
                    >
                      {connectingApp === app.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : connected ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {connected ? "Connected" : "Connect"}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
