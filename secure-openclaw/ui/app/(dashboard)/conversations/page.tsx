"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSessions } from "@/lib/hooks/use-sessions"
import { Loader2, MessageSquare, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function ConversationsPage() {
  const { data: sessions, isLoading, error } = useSessions()

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
        <p className="text-destructive font-medium">Failed to load conversations</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Conversations</h2>
        <p className="text-muted-foreground">
          Manage and view message history for all active agent sessions.
        </p>
      </div>

      <div className="grid gap-4">
        {sessions?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Messages from WhatsApp, Telegram, or the web UI will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          sessions?.map((session) => (
            <Link key={session.key} href={`/conversations/${session.key}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-base truncate max-w-[300px] md:max-w-md">
                      {session.key}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Last active {formatDistanceToNow(session.lastActivity)} ago
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{session.transcriptCount} messages</p>
                      <p className="text-xs text-muted-foreground">
                        {session.lastRunId ? "Processed" : "Idle"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
