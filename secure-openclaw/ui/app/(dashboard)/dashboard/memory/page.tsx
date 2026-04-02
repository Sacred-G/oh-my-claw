"use client"

import { useState } from "react"
import { useLongTermMemory, useDailyMemoryFiles, useDailyMemory, useUpdateMemory, useMemorySearch } from "@/lib/hooks/use-memory"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Save, Search, FileText, Calendar, History } from "lucide-react"
import { toast } from "sonner"

interface MemoryEditorProps {
  initialContent: string
  onSave: (content: string) => Promise<void>
  isPending: boolean
  title: string
  description?: string
  placeholder?: string
}

function MemoryEditor({ initialContent, onSave, isPending, title, description, placeholder }: MemoryEditorProps) {
  const [content, setContent] = useState(initialContent)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button 
          onClick={() => onSave(content)} 
          disabled={isPending}
          size="sm"
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-full w-full resize-none border-0 focus-visible:ring-0 font-mono text-sm p-4"
          placeholder={placeholder}
        />
      </CardContent>
    </Card>
  )
}

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState("long-term")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<string>("")

  const { data: longTerm, isLoading: isLoadingLongTerm } = useLongTermMemory()
  const { data: dailyFiles, isLoading: isLoadingFiles } = useDailyMemoryFiles()
  
  const effectiveSelectedDate = selectedDate || (dailyFiles?.[0]?.replace(".md", "") ?? "")
  
  const { data: dailyMemory, isLoading: isLoadingDaily } = useDailyMemory(effectiveSelectedDate)
  const { data: searchResults, isLoading: isSearching } = useMemorySearch(searchQuery)
  const updateMemory = useUpdateMemory()

  const handleSave = async (content: string) => {
    try {
      await updateMemory.mutateAsync({
        type: activeTab as "long-term" | "daily",
        date: activeTab === "daily" ? effectiveSelectedDate : undefined,
        content,
      })
      toast.success("Memory updated successfully")
    } catch {
      toast.error("Failed to update memory")
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full max-h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Persistent Memory</h2>
        <p className="text-muted-foreground">
          View and manage the agent&apos;s long-term memory and daily activity logs.
        </p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex-3 flex flex-col gap-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="long-term" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Long-Term
                </TabsTrigger>
                <TabsTrigger value="daily" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Daily Logs
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="long-term" className="flex-1 mt-4 overflow-hidden">
              {isLoadingLongTerm ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <MemoryEditor
                  key="long-term-editor"
                  initialContent={longTerm?.content || ""}
                  onSave={handleSave}
                  isPending={updateMemory.isPending}
                  title="MEMORY.md"
                  description="Main curated knowledge base for the agent."
                  placeholder="Enter long-term memory content..."
                />
              )}
            </TabsContent>

            <TabsContent value="daily" className="flex-1 mt-4 overflow-hidden">
              <div className="grid grid-cols-4 h-full gap-4 overflow-hidden">
                <div className="col-span-1 flex flex-col gap-2 overflow-hidden">
                  <p className="text-xs font-semibold text-muted-foreground uppercase px-1">Log Files</p>
                  <ScrollArea className="flex-1 border rounded-lg bg-card">
                    <div className="flex flex-col p-1">
                      {isLoadingFiles ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        dailyFiles?.map((file) => {
                          const date = file.replace(".md", "")
                          return (
                            <Button
                              key={file}
                              variant={effectiveSelectedDate === date ? "secondary" : "ghost"}
                              size="sm"
                              className="justify-start font-normal"
                              onClick={() => setSelectedDate(date)}
                            >
                              <History className="h-3 w-3 mr-2 text-muted-foreground" />
                              {date}
                            </Button>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="col-span-3 flex flex-col overflow-hidden">
                  {isLoadingDaily ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : effectiveSelectedDate ? (
                    <MemoryEditor
                      key={`daily-editor-${effectiveSelectedDate}`}
                      initialContent={dailyMemory?.content || ""}
                      onSave={handleSave}
                      isPending={updateMemory.isPending}
                      title={`memory/${effectiveSelectedDate}.md`}
                      placeholder="Log content..."
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Select a date to view activity log.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden border-l pl-6 max-w-sm">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Memory
            </h3>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4">
              {isSearching && (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {searchQuery && !isSearching && searchResults?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No matches found for &quot;{searchQuery}&quot;
                </p>
              )}
              {searchResults?.map((result, i) => (
                <div key={i} className="flex flex-col gap-2 border rounded-lg p-3 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {result.file}
                    </span>
                  </div>
                  {result.matches.map((match, j) => (
                    <div key={j} className="text-[11px] font-mono bg-muted/30 p-2 rounded border border-border/50">
                      <div className="text-muted-foreground mb-1">Line {match.line}:</div>
                      <div className="whitespace-pre-wrap">{match.context}</div>
                    </div>
                  ))}
                </div>
              ))}
              {!searchQuery && (
                <div className="text-center py-10 opacity-50">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs">Enter at least 2 characters to search across all memory files.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
