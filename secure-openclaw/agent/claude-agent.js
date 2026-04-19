import { EventEmitter } from 'events'
import MemoryManager from '../memory/manager.js'
import { createCronMcpServer, setContext as setCronContext, getScheduler } from '../tools/cron.js'
import { createGatewayMcpServer, setGatewayContext } from '../tools/gateway.js'
import { createAppleScriptMcpServer } from '../tools/applescript.js'
import { getProvider } from '../providers/index.js'
import { buildSystemPrompt } from './prompt-builder.js'
import McpBridge from './mcp-bridge.js'
import fs from 'fs'
import path from 'path'

/**
 * Claude Agent using the Claude Agent SDK
 * With memory system and cron MCP server
 */
export default class ClaudeAgent extends EventEmitter {
  constructor(config = {}) {
    super()
    this.memoryManager = new MemoryManager()
    this.cronMcpServer = createCronMcpServer()
    this.cronScheduler = getScheduler()
    this.gatewayMcpServer = createGatewayMcpServer()
    this.gateway = null // Set by gateway after construction
    this.sessions = new Map()
    this.abortControllers = new Map()

    // Provider setup
    this.workspace = config.workspace || process.cwd()
    this.providerName = config.provider || 'claude'
    const providerConfig = {
      allowedTools: config.allowedTools,
      maxTurns: config.maxTurns,
      permissionMode: config.permissionMode,
    }
    if (this.providerName === 'opencode') {
      Object.assign(providerConfig, config.opencode || {})
    }
    this.provider = getProvider(this.providerName, providerConfig)

    this.allowedTools = config.allowedTools || [
      'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
      'TodoWrite', 'Skill', 'AskUserQuestion', 'read_pdf'
    ]

    // Add cron MCP tools to allowed list
    this.cronTools = [
      'mcp__cron__schedule_delayed',
      'mcp__cron__schedule_recurring',
      'mcp__cron__schedule_cron',
      'mcp__cron__list_scheduled',
      'mcp__cron__cancel_scheduled'
    ]

    // Add gateway MCP tools to allowed list
    this.gatewayTools = [
      'mcp__gateway__send_message',
      'mcp__gateway__list_platforms',
      'mcp__gateway__get_queue_status',
      'mcp__gateway__get_current_context',
      'mcp__gateway__list_sessions',
      'mcp__gateway__broadcast_message',
      'mcp__gateway__send_image',
      'mcp__gateway__send_document',
      'mcp__gateway__generate_image'
    ]

    // AppleScript tools (macOS only)
    this.applescriptMcpServer = createAppleScriptMcpServer()
    this.applescriptTools = this.applescriptMcpServer ? [
      'mcp__applescript__run_script',
      'mcp__applescript__list_apps',
      'mcp__applescript__activate_app',
      'mcp__applescript__display_notification'
    ] : []

    this.permissionMode = config.permissionMode || 'default'

    // MCP Bridge for non-Claude providers
    this.mcpBridge = null
    this.mcpBridgeInitializing = false

    // Forward cron events
    this.cronScheduler.on('execute', (data) => this.emit('cron:execute', data))
  }

  getSession(sessionKey) {
    if (!this.sessions.has(sessionKey)) {
      this.sessions.set(sessionKey, {
        sdkSessionId: null,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0
      })
    }
    return this.sessions.get(sessionKey)
  }

  abort(sessionKey) {
    // Delegate abort to the provider
    return this.provider.abort(sessionKey)
  }

  getCronSummary() {
    const jobs = this.cronScheduler.list()
    if (jobs.length === 0) return null
    return jobs.map(j => `- ${j.id}: ${j.description} (${j.type})`).join('\n')
  }

  /**
   * Build prompt - supports images for vision
   */
  buildPrompt(message, image) {
    if (!image) return message

    return [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.data
        }
      },
      {
        type: 'text',
        text: message
      }
    ]
  }

  /**
   * Generate streaming messages for the SDK
   */
  async *generateMessages(message, image) {
    yield {
      type: 'user',
      message: {
        role: 'user',
        content: this.buildPrompt(message, image)
      }
    }
  }

  /**
   * Initialize or get the MCP Bridge for non-Claude providers
   */
  async ensureMcpBridge(mcpServers = {}, context = {}) {
    if (this.mcpBridge?.initialized) {
      this.mcpBridge.updateContext(context)
      return this.mcpBridge
    }

    if (this.mcpBridgeInitializing) {
      while (this.mcpBridgeInitializing) {
        await new Promise(r => setTimeout(r, 100))
      }
      if (this.mcpBridge?.initialized) {
        this.mcpBridge.updateContext(context)
        return this.mcpBridge
      }
    }

    this.mcpBridgeInitializing = true
    console.log(`[${this.providerName}] Initializing MCP Bridge...`)

    try {
      this.mcpBridge = new McpBridge()

      // Load external MCP servers from mcp-servers.json
      let externalMcpServers = {}
      const mcpConfigPath = path.join(process.cwd(), 'mcp-servers.json')
      try {
        if (fs.existsSync(mcpConfigPath)) {
          externalMcpServers = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'))
        }
      } catch (e) {
        console.error('[Agent] Failed to load mcp-servers.json:', e.message)
      }

      await this.mcpBridge.initialize(mcpServers, externalMcpServers, context)
      return this.mcpBridge
    } catch (err) {
      console.error('[Agent] MCP Bridge initialization failed:', err.message)
      this.mcpBridge = new McpBridge()
      this.mcpBridge.registerFileTools()
      this.mcpBridge.initialized = true
      return this.mcpBridge
    } finally {
      this.mcpBridgeInitializing = false
    }
  }

  /**
   * Run the agent for a message
   */
  async *run(params) {
    const {
      message,
      sessionKey,
      platform = 'unknown',
      chatId = null,
      image = null,
      mcpServers = {},
      canUseTool
    } = params

    const session = this.getSession(sessionKey)
    session.lastActivity = Date.now()
    session.messageCount++

    // Set cron context for scheduled messages
    setCronContext({ platform, chatId, sessionKey })

    // Set gateway context
    setGatewayContext({
      gateway: this.gateway,
      currentPlatform: platform,
      currentChatId: chatId,
      currentSessionKey: sessionKey
    })

    // Combine all allowed tools
    const allAllowedTools = [...this.allowedTools, ...this.cronTools, ...this.gatewayTools, ...this.applescriptTools]

    // Build system prompt
    const memoryContext = this.memoryManager.getMemoryContext()
    const cronInfo = this.getCronSummary()
    const systemPrompt = buildSystemPrompt({
      memoryContext,
      sessionInfo: { sessionKey, platform },
      cronInfo,
      providerName: this.providerName,
      workspace: this.workspace,
      toolCount: allAllowedTools.length
    })

    const allMcpServers = {
      cron: this.cronMcpServer,
      gateway: this.gatewayMcpServer,
      ...(this.applescriptMcpServer ? { applescript: this.applescriptMcpServer } : {}),
      ...mcpServers
    }

    // Initialize bridge if using a provider that requires it (OpenAI, etc.)
    let bridge = null
    if (this.providerName !== 'claude') {
      bridge = await this.ensureMcpBridge(allMcpServers, {
        gateway: this.gateway,
        platform,
        chatId,
        sessionKey
      })
    }

    if (image) console.log('[ClaudeAgent] With image attachment')

    this.emit('run:start', { sessionKey, message, hasImage: !!image })

    try {
      let fullText = ''
      let hasStreamedContent = false

      // Delegate to provider - pass prompt and all options
      const queryParams = {
        prompt: this.generateMessages(message, image),
        chatId: sessionKey,
        mcpServers: allMcpServers,
        allowedTools: allAllowedTools,
        maxTurns: this.maxTurns,
        systemPrompt,
        permissionMode: this.permissionMode,
        bridge // Pass bridge for providers that need it
      }
      if (canUseTool) {
        queryParams.canUseTool = canUseTool
      }
      for await (const chunk of this.provider.query(queryParams)) {
        // Handle streaming partial messages (token-level streaming)
        if (chunk.type === 'stream_event' && chunk.event) {
          const event = chunk.event
          hasStreamedContent = true

          // Text delta - stream individual tokens
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const text = event.delta.text
            if (text) {
              fullText += text
              yield { type: 'text', content: text, isReasoning: !!event.isReasoning }
              this.emit('run:text', { sessionKey, content: text })
            }
          }
          // Tool use start
          else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            yield {
              type: 'tool_use',
              name: event.content_block.name,
              input: event.content_block.input || {},
              id: event.content_block.id
            }
            this.emit('run:tool', { sessionKey, name: event.content_block.name })
          }
          continue
        }

        // Handle complete assistant messages (only if we haven't streamed content)
        if (chunk.type === 'assistant' && chunk.message?.content) {
          for (const block of chunk.message.content) {
            if (block.type === 'text' && block.text && !hasStreamedContent) {
              fullText += block.text
              yield { type: 'text', content: block.text }
              this.emit('run:text', { sessionKey, content: block.text })
            } else if (block.type === 'tool_use') {
              if (!hasStreamedContent) {
                yield { type: 'tool_use', name: block.name, input: block.input, id: block.id }
                this.emit('run:tool', { sessionKey, name: block.name })
              }
            }
          }
          continue
        }

        // Handle tool results
        if (chunk.type === 'tool_result' || chunk.type === 'result') {
          yield { type: 'tool_result', result: chunk.result || chunk.content }
          continue
        }

        // Handle done/aborted/error from provider
        if (chunk.type === 'done') {
          break
        }
        if (chunk.type === 'aborted') {
          // silently handle abort
          yield { type: 'aborted' }
          this.emit('run:aborted', { sessionKey })
          return
        }
        if (chunk.type === 'error') {
          yield { type: 'error', error: chunk.error }
          this.emit('run:error', { sessionKey, error: chunk.error })
          return
        }

        if (chunk.type !== 'system') {
          yield chunk
        }
      }

      yield { type: 'done', fullText }
      this.emit('run:complete', { sessionKey, response: fullText })

    } catch (error) {
      if (error.name === 'AbortError') {
        // silently handle abort
        yield { type: 'aborted' }
        this.emit('run:aborted', { sessionKey })
      } else {
        console.error('[ClaudeAgent] Error:', error)
        yield { type: 'error', error: error.message }
        this.emit('run:error', { sessionKey, error })
        throw error
      }
    }
  }

  /**
   * Run and collect full response
   */
  async runAndCollect(params) {
    let fullText = ''
    for await (const chunk of this.run(params)) {
      if (chunk.type === 'text') {
        fullText += chunk.content
      }
      if (chunk.type === 'done') {
        return chunk.fullText || fullText
      }
      if (chunk.type === 'error') {
        throw new Error(chunk.error)
      }
    }
    return fullText
  }

  stopCron() {
    this.cronScheduler.stop()
  }
}
