"use client"

import { useState } from "react"
import Image from "next/image"
import { useIntegrations, useAvailableToolkits, connectApp } from "@/lib/hooks/use-integrations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Blocks, ExternalLink, CheckCircle2, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function IntegrationsPage() {
  const { data: connectedApps, isLoading, error: connectedError } = useIntegrations()
  const { data: availableToolkits, isLoading: isLoadingToolkits, error: toolkitsError } = useAvailableToolkits()
  const [connectingApp, setConnectingApp] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  console.log('[Integrations] Connected apps:', connectedApps)
  console.log('[Integrations] Available toolkits:', availableToolkits)
  console.log('[Integrations] Errors:', { connectedError, toolkitsError })

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
    return connectedApps?.some((app) => app.toolkit?.slug?.toLowerCase() === appName.toLowerCase())
  }

  const getToolkitLogo = (slug: string | undefined) => {
    if (!slug || !availableToolkits) return null
    const toolkit = availableToolkits.find((t) => t.slug.toLowerCase() === slug.toLowerCase())
    return toolkit?.meta?.logo
  }

  const getToolkitName = (slug: string | undefined) => {
    if (!slug || !availableToolkits) return slug?.replace(/_/g, " ") || "Unknown App"
    const toolkit = availableToolkits.find((t) => t.slug.toLowerCase() === slug.toLowerCase())
    return toolkit?.name || slug.replace(/_/g, " ")
  }

  const filteredToolkits = availableToolkits?.filter((toolkit) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      toolkit.name.toLowerCase().includes(query) ||
      toolkit.slug.toLowerCase().includes(query) ||
      toolkit.meta.description.toLowerCase().includes(query) ||
      toolkit.meta.categories.some((cat) => cat.name.toLowerCase().includes(query))
    )
  })

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
          ) : connectedError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-destructive">Failed to load connected apps</p>
                <p className="text-xs text-muted-foreground mt-2">{String(connectedError)}</p>
              </CardContent>
            </Card>
          ) : !connectedApps || connectedApps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Blocks className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">No apps connected yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connectedApps.map((app) => {
                console.log('[Connected App]', app)
                const logo = getToolkitLogo(app.toolkit?.slug)
                const appName = getToolkitName(app.toolkit?.slug)
                return (
                  <Card key={app.id} className="overflow-hidden border-green-500/20 bg-green-500/5">
                    <CardHeader className="py-4">
                      <div className="flex items-start gap-3">
                        {logo && (
                          <div className="w-10 h-10 shrink-0 relative">
                            <Image
                              src={logo}
                              alt={`${appName} logo`}
                              width={40}
                              height={40}
                              className="rounded object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base truncate">{appName}</CardTitle>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
                              {app.status || "Connected"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Active and ready for tool usage.
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Available Integrations
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search toolkits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {isLoadingToolkits ? (
            <div className="flex py-10 justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : toolkitsError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-destructive">Failed to load available toolkits</p>
                <p className="text-xs text-muted-foreground mt-2">{String(toolkitsError)}</p>
              </CardContent>
            </Card>
          ) : !filteredToolkits || filteredToolkits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Blocks className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No toolkits match your search." : "No toolkits available."}
                </p>
                {!searchQuery && availableToolkits && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Loaded {availableToolkits.length} toolkits total
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredToolkits.map((toolkit) => {
                const connected = isConnected(toolkit.slug)
                const primaryCategory = toolkit.meta.categories[0]?.name || "Tools"
                return (
                  <Card key={toolkit.slug} className={connected ? "opacity-60" : ""}>
                    <CardHeader className="py-4">
                      <div className="flex items-start gap-3">
                        {toolkit.meta.logo && (
                          <div className="w-10 h-10 shrink-0 relative">
                            <Image
                              src={toolkit.meta.logo}
                              alt={`${toolkit.name} logo`}
                              width={40}
                              height={40}
                              className="rounded object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base truncate">{toolkit.name}</CardTitle>
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider shrink-0">
                              {primaryCategory}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs line-clamp-2 mt-1">
                            {toolkit.meta.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 flex-col gap-2">
                      <div className="flex gap-4 text-xs text-muted-foreground w-full">
                        <span>{toolkit.meta.tools_count} tools</span>
                        {toolkit.meta.triggers_count > 0 && (
                          <span>{toolkit.meta.triggers_count} triggers</span>
                        )}
                      </div>
                      <Button
                        variant={connected ? "outline" : "default"}
                        size="sm"
                        className="w-full gap-2"
                        disabled={connected || connectingApp === toolkit.slug}
                        onClick={() => handleConnect(toolkit.slug)}
                      >
                        {connectingApp === toolkit.slug ? (
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
          )}
        </section>
      </div>
    </div>
  )
}
