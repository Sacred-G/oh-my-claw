"use client"

import { useScheduling } from "@/lib/hooks/use-scheduling"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Clock, Calendar, MessageSquare, Bot, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function SchedulingPage() {
  const { data: jobs, isLoading, error } = useScheduling()

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
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">Failed to load scheduled jobs</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Scheduling</h2>
        <p className="text-muted-foreground">
          View and manage automated tasks and scheduled messages.
        </p>
      </div>

      <div className="grid gap-4">
        {!jobs || jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No scheduled jobs found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Jobs can be added via the /remind or /schedule slash commands.
              </p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.jobId} className="overflow-hidden">
              <CardHeader className="py-4 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-mono">{job.jobId}</CardTitle>
                  </div>
                  <Badge variant={job.invokeAgent ? "default" : "secondary"} className="gap-1">
                    {job.invokeAgent ? <Bot className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                    {job.invokeAgent ? "Agent Run" : "Direct Message"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-4 grid gap-4">
                <div className="grid gap-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Schedule (Cron)</p>
                  <code className="text-sm font-mono bg-muted p-1 rounded w-fit">{job.cronExpression}</code>
                </div>
                
                <div className="grid gap-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Target</p>
                  <p className="text-sm">
                    Platform: <span className="font-medium capitalize">{job.platform}</span>
                    <span className="mx-2 text-muted-foreground">|</span>
                    Chat ID: <span className="font-medium truncate max-w-[200px] inline-block align-bottom">{job.chatId}</span>
                  </p>
                </div>

                <div className="grid gap-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Message Template</p>
                  <p className="text-sm border-l-2 pl-3 italic text-muted-foreground whitespace-pre-wrap">
                    {job.message}
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t">
                  {job.lastRun && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Last Run</p>
                      <p className="text-xs">{formatDistanceToNow(job.lastRun)} ago</p>
                    </div>
                  )}
                  {job.nextRun && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Next Run</p>
                      <p className="text-xs">In {formatDistanceToNow(job.nextRun)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
