"use client"

import { useState } from "react"
import { useConfig, useUpdateConfig, type Config } from "@/lib/hooks/use-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Loader2, Save, MessageSquare, Bot, Globe, Shield } from "lucide-react"
import { toast } from "sonner"

interface ConfigFormProps {
  config: Config
  onSave: (newConfig: Config) => Promise<void>
  isPending: boolean
}

type PlatformKey = Extract<keyof Config, 'whatsapp' | 'imessage' | 'telegram' | 'signal'>
type AgentField = Extract<keyof Config['agent'], 'workspace' | 'maxTurns' | 'allowedTools' | 'provider'>

function ConfigForm({ config, onSave, isPending }: ConfigFormProps) {
  const [localConfig, setLocalConfig] = useState<Config>(config)

  const handleSave = async () => {
    await onSave(localConfig)
  }

  const updatePlatform = <P extends PlatformKey>(
    platform: P,
    field: string,
    value: string | boolean | string[]
  ) => {
    setLocalConfig((prev) => ({
      ...prev,
      [platform]: {
        ...(prev[platform] as Record<string, unknown>),
        [field]: value,
      },
    }))
  }

  const updateAgent = (field: AgentField, value: string | number | string[]) => {
    setLocalConfig((prev) => ({
      ...prev,
      agent: {
        ...prev.agent,
        [field]: value,
      },
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
          <p className="text-muted-foreground">
            Manage messaging platforms and agent settings.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Agent Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent Settings
            </CardTitle>
            <CardDescription>Core behavior and provider settings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agent-provider">Provider</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={localConfig.agent.provider === 'claude' ? 'default' : 'outline'}
                    onClick={() => updateAgent('provider', 'claude')}
                    className="flex-1"
                  >
                    Claude
                  </Button>
                  <Button 
                    variant={localConfig.agent.provider === 'opencode' ? 'default' : 'outline'}
                    onClick={() => updateAgent('provider', 'opencode')}
                    className="flex-1"
                  >
                    Opencode
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Turns ({localConfig.agent.maxTurns})</Label>
                <Slider 
                  value={[localConfig.agent.maxTurns]} 
                  min={10} 
                  max={200} 
                  step={5} 
                  onValueChange={(v: number | readonly number[]) => {
                    const value = Array.isArray(v) ? v[0] : v
                    updateAgent('maxTurns', value)
                  }}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agent-workspace">Workspace Directory</Label>
                <Input 
                  id="agent-workspace"
                  value={localConfig.agent.workspace}
                  onChange={(e) => updateAgent('workspace', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-id">Agent ID</Label>
                <Input 
                  id="agent-id"
                  value={localConfig.agentId}
                  onChange={(e) => setLocalConfig({...localConfig, agentId: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                WhatsApp
              </CardTitle>
              <CardDescription>Messaging via WhatsApp.</CardDescription>
            </div>
            <Switch 
              checked={localConfig.whatsapp.enabled}
              onCheckedChange={(v) => updatePlatform('whatsapp', 'enabled', v)}
            />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="wa-mentions">Respond to Mentions Only</Label>
              <Switch 
                id="wa-mentions"
                checked={localConfig.whatsapp.respondToMentionsOnly}
                onCheckedChange={(v) => updatePlatform('whatsapp', 'respondToMentionsOnly', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Allowed DMs (Comma separated)</Label>
              <Input 
                value={localConfig.whatsapp.allowedDMs.join(', ')}
                onChange={(e) => updatePlatform('whatsapp', 'allowedDMs', e.target.value.split(',').map(s => s.trim()))}
                placeholder="*, +1234567890"
              />
            </div>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Telegram
              </CardTitle>
              <CardDescription>Messaging via Telegram Bot.</CardDescription>
            </div>
            <Switch 
              checked={localConfig.telegram.enabled}
              onCheckedChange={(v) => updatePlatform('telegram', 'enabled', v)}
            />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="tg-token">Bot Token</Label>
              <Input 
                id="tg-token"
                type="password"
                value={localConfig.telegram.token}
                onChange={(e) => updatePlatform('telegram', 'token', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tg-mentions">Respond to Mentions Only</Label>
              <Switch 
                id="tg-mentions"
                checked={localConfig.telegram.respondToMentionsOnly}
                onCheckedChange={(v) => updatePlatform('telegram', 'respondToMentionsOnly', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* iMessage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                iMessage
              </CardTitle>
              <CardDescription>Messaging via iMessage (macOS only).</CardDescription>
            </div>
            <Switch 
              checked={localConfig.imessage.enabled}
              onCheckedChange={(v) => updatePlatform('imessage', 'enabled', v)}
            />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">iMessage requires Full Disk Access and is currently {localConfig.imessage.enabled ? 'active' : 'disabled'}.</p>
          </CardContent>
        </Card>

        {/* Signal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Signal
              </CardTitle>
              <CardDescription>Messaging via Signal-CLI.</CardDescription>
            </div>
            <Switch 
              checked={localConfig.signal.enabled}
              onCheckedChange={(v) => updatePlatform('signal', 'enabled', v)}
            />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="sig-phone">Phone Number</Label>
              <Input 
                id="sig-phone"
                value={localConfig.signal.phoneNumber}
                onChange={(e) => updatePlatform('signal', 'phoneNumber', e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const { data: config, isLoading } = useConfig()
  const updateConfig = useUpdateConfig()

  if (isLoading || !config) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleSave = async (newConfig: Config): Promise<void> => {
    try {
      await updateConfig.mutateAsync(newConfig)
      toast.success("Configuration updated successfully")
    } catch {
      toast.error("Failed to update configuration")
    }
  }

  return (
    <ConfigForm 
      key={JSON.stringify(config)}
      config={config} 
      onSave={handleSave} 
      isPending={updateConfig.isPending} 
    />
  )
}
