"use client"

import { use, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useSessionDetail } from "@/lib/hooks/use-sessions"
import { useEventSource } from "@/lib/hooks/use-event-source"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, User, Bot, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface SSEEvent {
  sessionKey: string
  type: "text" | "tool" | "complete" | "error"
  content?: string
  name?: string
  error?: string
}

export default function ConversationDetailPage() {
  const params = useParams<{ key: string }>()
  const unwrappedParams = use(params as unknown as Promise<{ key: string }>)
  const sessionKey = unwrappedParams.key
  const { data: session, isLoading, error, refetch } = useSessionDetail(sessionKey)
  const { data: sseData } = useEventSource<SSEEvent>("/api/proxy/events")
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Handle SSE updates
  useEffect(() => {
    if (sseData && sseData.sessionKey === sessionKey) {
      if (sseData.type === "text") {
        setStreamingText((prev) => prev + (sseData.content ?? ""))
      } else if (sseData.type === "tool") {
        setActiveTool(sseData.name ?? null)
      } else if (sseData.type === "complete") {
        setStreamingText("")
        setActiveTool(null)
        refetch()
      } else if (sseData.type === "error") {
        setActiveTool(null)
        refetch()
      }
    }
  }, [sseData, sessionKey, refetch])

  // Auto-scroll to bottom on new messages or streaming text
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [session?.transcript, streamingText, activeTool])

  async function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!inputText.trim() || isSending) return

    setIsSending(true)
    const text = inputText
    setInputText("")

    try {
      const response = await fetch("/api/proxy/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionKey,
          text,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      // Refetch to see the new messages
      await refetch()
    } catch (err) {
      console.error("Error sending message:", err)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4 text-center">
        <p className="text-destructive font-medium">Failed to load conversation</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 h-full max-h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight truncate">{sessionKey}</h2>
        <p className="text-muted-foreground">
          View and send messages for this session.
        </p>
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last activity {formatDistanceToNow(session.lastActivity)} ago
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
            <div className="flex flex-col gap-4">
              {session.transcript.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  No messages in this conversation yet.
                </p>
              ) : (
                session.transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      {msg.role === "user" ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                      {msg.role === "user" ? "You" : "Agent"}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-[10px] opacity-70 self-end">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              
              {/* Streaming Content */}
              {(streamingText || activeTool) && (
                <div className="flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <Bot className="h-3 w-3" />
                    Agent (typing...)
                  </div>
                  <div className="whitespace-pre-wrap">{streamingText}</div>
                  {activeTool && (
                    <div className="flex items-center gap-2 text-xs text-blue-500 font-medium">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Using tool: {activeTool}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
            <Input
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!inputText.trim() || isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
