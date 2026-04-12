import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import { getScheduler, setContext as setCronContext } from '../tools/cron.js'
import { setGatewayContext, getGatewayContext } from '../tools/gateway.js'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

const execFileAsync = promisify(execFile)

/**
 * MCP Bridge - Provides all MCP tools to non-Claude providers (OpenAI, etc.)
 * 
 * Connects to:
 * 1. HTTP MCP servers (Composio Tool Router)
 * 2. Stdio MCP servers (Firecrawl, Civil3D, Blender, etc.)
 * 3. Local tools (cron, gateway, applescript) via direct function calls
 * 
 * Converts all discovered tools to OpenAI function call format and routes
 * tool executions back to the correct handler.
 */
export default class McpBridge extends EventEmitter {
  constructor() {
    super()
    this.tools = new Map()          // toolName -> { handler, source, schema }
    this.stdioClients = new Map()   // serverName -> StdioMcpClient
    this.httpClients = new Map()    // serverName -> { url, headers }
    this.initialized = false
    this.rpcId = 1
  }

  /**
   * Initialize the bridge with all MCP server configs
   * @param {Object} mcpServers - MCP server configs from gateway (includes composio, etc.)
   * @param {Object} externalMcpServers - External MCP servers from mcp-servers.json
   * @param {Object} context - Runtime context { gateway, platform, chatId, sessionKey }
   */
  async initialize(mcpServers = {}, externalMcpServers = {}, context = {}) {
    console.log('[McpBridge] Initializing...')

    // 1. Register local tools (cron, gateway, applescript)
    this.registerLocalTools(context)

    // 2. Connect to HTTP MCP servers (like Composio)
    for (const [name, config] of Object.entries(mcpServers)) {
      if (config.type === 'http' && config.url) {
        await this.connectHttpMcp(name, config)
      }
    }

    // 3. Connect to stdio MCP servers (Firecrawl, etc.)
    for (const [name, config] of Object.entries(externalMcpServers)) {
      if (config.type === 'stdio' && config.command) {
        await this.connectStdioMcp(name, config)
      }
    }

    this.initialized = true
    console.log(`[McpBridge] Ready with ${this.tools.size} tools from ${this.httpClients.size} HTTP + ${this.stdioClients.size} stdio + local sources`)
    return this
  }

  /**
   * Update runtime context (called before each agent run)
   */
  updateContext(context) {
    if (context.platform || context.chatId || context.sessionKey) {
      setCronContext({
        platform: context.platform,
        chatId: context.chatId,
        sessionKey: context.sessionKey
      })
    }
    if (context.gateway) {
      setGatewayContext({
        gateway: context.gateway,
        currentPlatform: context.platform,
        currentChatId: context.chatId,
        currentSessionKey: context.sessionKey
      })
    }
  }

  // ─── LOCAL TOOLS ──────────────────────────────────────────────────────

  registerLocalTools(context) {
    this.registerCronTools()
    this.registerGatewayTools()
    this.registerAppleScriptTools()
    this.registerFileTools()
    this.registerInteractionTools(context)
    this.registerLegacyAliases()
  }

  registerLegacyAliases() {
    // Alias common tools to match Claude Agent SDK naming conventions
    const aliases = {
      'Read': 'read_file',
      'Write': 'write_file',
      'Edit': 'edit_file',
      'Bash': 'bash'
    }

    for (const [newName, oldName] of Object.entries(aliases)) {
      const tool = this.tools.get(oldName)
      if (tool) {
        this.registerTool(newName, {
          ...tool,
          schema: { ...tool.schema, name: newName }
        })
      }
    }
  }

  registerCronTools() {
    const scheduler = getScheduler()

    this.registerTool('mcp__cron__schedule_delayed', {
      source: 'local:cron',
      schema: {
        name: 'mcp__cron__schedule_delayed',
        description: 'Schedule a one-time task after a delay. Use for reminders like "remind me in 30 minutes". Set invoke_agent=true to have the agent process the message and respond.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to send, or task for the agent if invoke_agent is true' },
            delay_seconds: { type: 'number', description: 'Delay in seconds before sending' },
            description: { type: 'string', description: 'Human-readable description of the reminder' },
            invoke_agent: { type: 'boolean', description: 'If true, the agent will process this message and respond' }
          },
          required: ['message', 'delay_seconds']
        }
      },
      handler: async (args) => {
        const ctx = getGatewayContext()
        return scheduler.scheduleDelayed({
          platform: ctx.currentPlatform,
          chatId: ctx.currentChatId,
          sessionKey: ctx.currentSessionKey,
          message: args.message,
          delaySeconds: args.delay_seconds,
          description: args.description,
          invokeAgent: args.invoke_agent
        })
      }
    })

    this.registerTool('mcp__cron__schedule_recurring', {
      source: 'local:cron',
      schema: {
        name: 'mcp__cron__schedule_recurring',
        description: 'Schedule a recurring task at regular intervals. Set invoke_agent=true to have the agent process and respond each time.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to send each time' },
            interval_seconds: { type: 'number', description: 'Interval in seconds between executions' },
            description: { type: 'string', description: 'Human-readable description' },
            invoke_agent: { type: 'boolean', description: 'If true, the agent will process this message each time' }
          },
          required: ['message', 'interval_seconds']
        }
      },
      handler: async (args) => {
        const ctx = getGatewayContext()
        return scheduler.scheduleRecurring({
          platform: ctx.currentPlatform,
          chatId: ctx.currentChatId,
          sessionKey: ctx.currentSessionKey,
          message: args.message,
          intervalSeconds: args.interval_seconds,
          description: args.description,
          invokeAgent: args.invoke_agent
        })
      }
    })

    this.registerTool('mcp__cron__schedule_cron', {
      source: 'local:cron',
      schema: {
        name: 'mcp__cron__schedule_cron',
        description: 'Schedule a task using cron expression. Format: "minute hour day month weekday". Examples: "0 9 * * *" for 9am daily.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to send' },
            cron: { type: 'string', description: 'Cron expression: "minute hour day month weekday"' },
            description: { type: 'string', description: 'Human-readable description' },
            invoke_agent: { type: 'boolean', description: 'If true, the agent will process and respond' }
          },
          required: ['message', 'cron']
        }
      },
      handler: async (args) => {
        const ctx = getGatewayContext()
        return scheduler.scheduleCron({
          platform: ctx.currentPlatform,
          chatId: ctx.currentChatId,
          sessionKey: ctx.currentSessionKey,
          message: args.message,
          cron: args.cron,
          description: args.description,
          invokeAgent: args.invoke_agent
        })
      }
    })

    this.registerTool('mcp__cron__list_scheduled', {
      source: 'local:cron',
      schema: {
        name: 'mcp__cron__list_scheduled',
        description: 'List all scheduled jobs (reminders, recurring messages, cron jobs).',
        parameters: { type: 'object', properties: {} }
      },
      handler: async () => scheduler.list()
    })

    this.registerTool('mcp__cron__cancel_scheduled', {
      source: 'local:cron',
      schema: {
        name: 'mcp__cron__cancel_scheduled',
        description: 'Cancel a scheduled job by its ID.',
        parameters: {
          type: 'object',
          properties: {
            job_id: { type: 'string', description: 'The job ID to cancel' }
          },
          required: ['job_id']
        }
      },
      handler: async (args) => scheduler.cancel(args.job_id)
    })

    console.log('[McpBridge] Registered 5 cron tools')
  }

  registerGatewayTools() {
    this.registerTool('mcp__gateway__send_message', {
      source: 'local:gateway',
      schema: {
        name: 'mcp__gateway__send_message',
        description: 'Send a message to a specific chat on any connected platform.',
        parameters: {
          type: 'object',
          properties: {
            platform: { type: 'string', enum: ['whatsapp', 'imessage', 'telegram', 'signal'], description: 'The messaging platform' },
            chat_id: { type: 'string', description: 'The chat ID to send to' },
            message: { type: 'string', description: 'The message text to send' }
          },
          required: ['platform', 'chat_id', 'message']
        }
      },
      handler: async (args) => {
        const { gateway } = getGatewayContext()
        if (!gateway) return { success: false, error: 'Gateway not available' }
        const adapter = gateway.adapters.get(args.platform)
        if (!adapter) return { success: false, error: `Platform ${args.platform} not connected` }
        try {
          await adapter.sendMessage(args.chat_id, args.message)
          return { success: true, platform: args.platform, chat_id: args.chat_id }
        } catch (err) {
          return { success: false, error: err.message }
        }
      }
    })

    this.registerTool('mcp__gateway__list_platforms', {
      source: 'local:gateway',
      schema: {
        name: 'mcp__gateway__list_platforms',
        description: 'List all connected messaging platforms and their status.',
        parameters: { type: 'object', properties: {} }
      },
      handler: async () => {
        const { gateway } = getGatewayContext()
        if (!gateway) return { success: false, error: 'Gateway not available' }
        const platforms = []
        for (const [name, adapter] of gateway.adapters) {
          platforms.push({ name, connected: !!adapter.sock || !!adapter.bot || !!adapter.process })
        }
        return { success: true, platforms }
      }
    })

    this.registerTool('mcp__gateway__get_current_context', {
      source: 'local:gateway',
      schema: {
        name: 'mcp__gateway__get_current_context',
        description: 'Get information about the current conversation context (platform, chat, session).',
        parameters: { type: 'object', properties: {} }
      },
      handler: async () => {
        const ctx = getGatewayContext()
        return { success: true, platform: ctx.currentPlatform, chat_id: ctx.currentChatId, session_key: ctx.currentSessionKey }
      }
    })

    this.registerTool('mcp__gateway__get_queue_status', {
      source: 'local:gateway',
      schema: {
        name: 'mcp__gateway__get_queue_status',
        description: 'Get the current message queue status.',
        parameters: {
          type: 'object',
          properties: {
            session_key: { type: 'string', description: 'Optional session key to check specific session' }
          }
        }
      },
      handler: async (args) => {
        const { gateway } = getGatewayContext()
        if (!gateway) return { success: false, error: 'Gateway not available' }
        if (args.session_key) {
          return { success: true, ...gateway.agentRunner.getQueueStatus(args.session_key) }
        }
        return { success: true, ...gateway.agentRunner.getGlobalStats() }
      }
    })

    this.registerTool('mcp__gateway__list_sessions', {
      source: 'local:gateway',
      schema: {
        name: 'mcp__gateway__list_sessions',
        description: 'List all active sessions with their last activity time.',
        parameters: { type: 'object', properties: {} }
      },
      handler: async () => {
        const { gateway } = getGatewayContext()
        if (!gateway) return { success: false, error: 'Gateway not available' }
        const sessions = []
        for (const [key, data] of gateway.agentRunner.agent.sessions) {
          sessions.push({
            key, message_count: data.messageCount,
            last_activity: new Date(data.lastActivity).toISOString(),
            created: new Date(data.createdAt).toISOString()
          })
        }
        return { success: true, sessions, count: sessions.length }
      }
    })

    this.registerTool('mcp__gateway__broadcast_message', {
      source: 'local:gateway',
      schema: {
        name: 'mcp__gateway__broadcast_message',
        description: 'Send a message to multiple chats across platforms. Use with caution.',
        parameters: {
          type: 'object',
          properties: {
            targets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string', enum: ['whatsapp', 'imessage', 'telegram', 'signal'] },
                  chat_id: { type: 'string' }
                },
                required: ['platform', 'chat_id']
              },
              description: 'Array of targets to send to'
            },
            message: { type: 'string', description: 'The message to broadcast' }
          },
          required: ['targets', 'message']
        }
      },
      handler: async (args) => {
        const { gateway } = getGatewayContext()
        if (!gateway) return { success: false, error: 'Gateway not available' }
        const results = []
        for (const target of args.targets) {
          const adapter = gateway.adapters.get(target.platform)
          if (!adapter) {
            results.push({ ...target, success: false, error: 'Platform not connected' })
            continue
          }
          try {
            await adapter.sendMessage(target.chat_id, args.message)
            results.push({ ...target, success: true })
          } catch (err) {
            results.push({ ...target, success: false, error: err.message })
          }
        }
        return { success: true, sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results }
      }
    })

    console.log('[McpBridge] Registered 6 gateway tools')
  }

  registerAppleScriptTools() {
    if (process.platform !== 'darwin') {
      console.log('[McpBridge] Not on macOS, skipping AppleScript tools')
      return
    }

    const runOsascript = async (script) => {
      try {
        const { stdout, stderr } = await execFileAsync('osascript', ['-e', script], { timeout: 30000 })
        return { success: true, output: stdout.trim(), stderr: stderr.trim() || undefined }
      } catch (err) {
        return { success: false, error: err.message, stderr: err.stderr?.trim() }
      }
    }

    this.registerTool('mcp__applescript__run_script', {
      source: 'local:applescript',
      schema: {
        name: 'mcp__applescript__run_script',
        description: 'Execute arbitrary AppleScript code via osascript. Returns stdout/stderr. Use for macOS automation.',
        parameters: {
          type: 'object',
          properties: {
            script: { type: 'string', description: 'The AppleScript code to execute' }
          },
          required: ['script']
        }
      },
      handler: async (args) => runOsascript(args.script)
    })

    this.registerTool('mcp__applescript__list_apps', {
      source: 'local:applescript',
      schema: {
        name: 'mcp__applescript__list_apps',
        description: 'List currently running (foreground) applications on macOS.',
        parameters: { type: 'object', properties: {} }
      },
      handler: async () => runOsascript('tell application "System Events" to get name of every process whose background only is false')
    })

    this.registerTool('mcp__applescript__activate_app', {
      source: 'local:applescript',
      schema: {
        name: 'mcp__applescript__activate_app',
        description: 'Bring a macOS application to the foreground.',
        parameters: {
          type: 'object',
          properties: {
            app_name: { type: 'string', description: 'Name of the application to activate' }
          },
          required: ['app_name']
        }
      },
      handler: async (args) => runOsascript(`tell application "${args.app_name}" to activate`)
    })

    this.registerTool('mcp__applescript__display_notification', {
      source: 'local:applescript',
      schema: {
        name: 'mcp__applescript__display_notification',
        description: 'Show a macOS notification banner.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Notification body text' },
            title: { type: 'string', description: 'Notification title' }
          },
          required: ['message']
        }
      },
      handler: async (args) => {
        const titlePart = args.title ? ` with title "${args.title}"` : ''
        return runOsascript(`display notification "${args.message}"${titlePart}`)
      }
    })

    console.log('[McpBridge] Registered 4 AppleScript tools')
  }

  registerInteractionTools(context) {
    this.registerTool('AskUserQuestion', {
      source: 'local:interaction',
      schema: {
        name: 'AskUserQuestion',
        description: 'Ask the user a question with predefined options or for free-text input.',
        parameters: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string', description: 'The question to ask' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string', description: 'Short label for the option' },
                        description: { type: 'string', description: 'Longer description' }
                      },
                      required: ['label']
                    }
                  },
                  allowMultiple: { type: 'boolean' }
                },
                required: ['question']
              }
            }
          },
          required: ['questions']
        }
      },
      handler: async (args) => {
        const ctx = getGatewayContext()
        const gateway = ctx.gateway
        if (!gateway) return { error: 'Gateway not available' }

        // This logic mimics runner.js createMessagingCanUseTool
        const questions = args.questions || []
        let prompt = ''
        for (const q of questions) {
          prompt += `${q.question}\n\n`
          if (q.options) {
            q.options.forEach((opt, i) => {
              prompt += `${i + 1}) ${opt.label}`
              if (opt.description) prompt += ` — ${opt.description}`
              prompt += '\n'
            })
          }
          prompt += '\nReply with a number or type your answer.'
        }

        // We need the adapter and chatId from context
        const adapter = gateway.adapters.get(ctx.currentPlatform)
        const reply = await gateway.waitForApproval(ctx.currentChatId, adapter, prompt.trim())

        if (!reply) return { error: 'No response received (timed out).' }

        const num = parseInt(reply.trim())
        const firstQuestion = questions[0]
        if (firstQuestion?.options && num >= 1 && num <= firstQuestion.options.length) {
          return {
            questions: [{
              ...firstQuestion,
              answer: firstQuestion.options[num - 1].label
            }]
          }
        }

        return {
          questions: [{
            ...firstQuestion,
            answer: reply.trim()
          }]
        }
      }
    })

    console.log('[McpBridge] Registered interaction tools')
  }

  registerFileTools() {
    const workspace = path.join(os.homedir(), 'secure-openclaw')

    this.registerTool('bash', {
      source: 'local:builtin',
      schema: {
        name: 'bash',
        description: 'Run a shell command and return the output.',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The bash command to execute' },
            timeout: { type: 'number', description: 'Timeout in seconds (default 30)' }
          },
          required: ['command']
        }
      },
      handler: async (args) => {
        try {
          const timeout = (args.timeout || 30) * 1000
          const output = execSync(args.command, {
            cwd: workspace, timeout, maxBuffer: 1024 * 1024, encoding: 'utf-8', shell: '/bin/zsh'
          })
          return output.substring(0, 10000) || '(no output)'
        } catch (err) {
          return `Error: ${err.message}`
        }
      }
    })

    this.registerTool('read_file', {
      source: 'local:builtin',
      schema: {
        name: 'read_file',
        description: 'Read the contents of a file at the given path.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute or relative path to the file' }
          },
          required: ['path']
        }
      },
      handler: async (args) => {
        const filePath = path.isAbsolute(args.path) ? args.path : path.join(workspace, args.path)
        if (!fs.existsSync(filePath)) return `Error: File not found: ${filePath}`
        return fs.readFileSync(filePath, 'utf-8').substring(0, 20000)
      }
    })

    this.registerTool('write_file', {
      source: 'local:builtin',
      schema: {
        name: 'write_file',
        description: 'Write content to a file, creating directories if needed.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to write' },
            content: { type: 'string', description: 'Content to write to the file' }
          },
          required: ['path', 'content']
        }
      },
      handler: async (args) => {
        const filePath = path.isAbsolute(args.path) ? args.path : path.join(workspace, args.path)
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(filePath, args.content, 'utf-8')
        return `File written: ${filePath}`
      }
    })

    this.registerTool('edit_file', {
      source: 'local:builtin',
      schema: {
        name: 'edit_file',
        description: 'Replace a specific string in a file. Use for targeted edits.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to edit' },
            old_string: { type: 'string', description: 'The exact text to find and replace' },
            new_string: { type: 'string', description: 'The text to replace with' }
          },
          required: ['path', 'old_string', 'new_string']
        }
      },
      handler: async (args) => {
        const filePath = path.isAbsolute(args.path) ? args.path : path.join(workspace, args.path)
        if (!fs.existsSync(filePath)) return `Error: File not found: ${filePath}`
        const content = fs.readFileSync(filePath, 'utf-8')
        if (!content.includes(args.old_string)) return `Error: old_string not found in file`
        const newContent = content.replace(args.old_string, args.new_string)
        fs.writeFileSync(filePath, newContent, 'utf-8')
        return `File edited: ${filePath}`
      }
    })

    this.registerTool('list_directory', {
      source: 'local:builtin',
      schema: {
        name: 'list_directory',
        description: 'List files and directories at the given path.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to list' }
          },
          required: ['path']
        }
      },
      handler: async (args) => {
        const dirPath = path.isAbsolute(args.path) ? args.path : path.join(workspace, args.path)
        if (!fs.existsSync(dirPath)) return `Error: Directory not found: ${dirPath}`
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        return entries.map(e => `${e.isDirectory() ? '[dir]' : '[file]'} ${e.name}`).join('\n')
      }
    })

    this.registerTool('search_files', {
      source: 'local:builtin',
      schema: {
        name: 'search_files',
        description: 'Search for files matching a pattern using grep or find.',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Search pattern' },
            path: { type: 'string', description: 'Directory to search in' },
            type: { type: 'string', enum: ['grep', 'find'], description: 'grep for content, find for filenames' }
          },
          required: ['pattern', 'path']
        }
      },
      handler: async (args) => {
        const searchPath = path.isAbsolute(args.path) ? args.path : path.join(workspace, args.path)
        const searchType = args.type || 'grep'
        const cmd = searchType === 'grep'
          ? `grep -rn "${args.pattern}" "${searchPath}" --include="*" | head -50`
          : `find "${searchPath}" -name "${args.pattern}" | head -50`
        try {
          return execSync(cmd, { encoding: 'utf-8', timeout: 10000, shell: '/bin/zsh' }).substring(0, 10000) || '(no matches)'
        } catch (err) {
          return `Error: ${err.message}`
        }
      }
    })

    this.registerTool('Grep', {
      source: 'local:builtin',
      schema: {
        name: 'Grep',
        description: 'Search for a string pattern in files (recursive grep).',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'The string or regex to search for' },
            path: { type: 'string', description: 'Directory to search in (default: workspace root)' }
          },
          required: ['pattern']
        }
      },
      handler: async (args) => {
        const searchPath = args.path ? (path.isAbsolute(args.path) ? args.path : path.join(workspace, args.path)) : workspace
        const cmd = `grep -rn "${args.pattern}" "${searchPath}" --include="*" | head -50`
        try {
          return execSync(cmd, { encoding: 'utf-8', timeout: 10000, shell: '/bin/zsh' }).substring(0, 10000) || '(no matches)'
        } catch (err) {
          return `Error: ${err.message}`
        }
      }
    })

    this.registerTool('Glob', {
      source: 'local:builtin',
      schema: {
        name: 'Glob',
        description: 'Find files matching a glob pattern.',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Glob pattern (e.g. "**/*.js")' },
            path: { type: 'string', description: 'Directory to search in' }
          },
          required: ['pattern']
        }
      },
      handler: async (args) => {
        const searchPath = args.path ? (path.isAbsolute(args.path) ? args.path : path.join(workspace, args.path)) : workspace
        const cmd = `find "${searchPath}" -name "${args.pattern}" | head -50`
        try {
          return execSync(cmd, { encoding: 'utf-8', timeout: 10000, shell: '/bin/zsh' }).substring(0, 10000) || '(no matches)'
        } catch (err) {
          return `Error: ${err.message}`
        }
      }
    })

    this.registerTool('TodoWrite', {
      source: 'local:builtin',
      schema: {
        name: 'TodoWrite',
        description: 'Write a task to the todo list.',
        parameters: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'The task description' },
            status: { type: 'string', enum: ['todo', 'done'], default: 'todo' }
          },
          required: ['task']
        }
      },
      handler: async (args) => {
        const todoPath = path.join(workspace, 'TODO.md')
        const line = `- [${args.status === 'done' ? 'x' : ' '}] ${args.task} (${new Date().toISOString()})\n`
        fs.appendFileSync(todoPath, line)
        return `Task added to TODO.md: ${args.task}`
      }
    })

    this.registerTool('Skill', {
      source: 'local:builtin',
      schema: {
        name: 'Skill',
        description: 'Use a reusable agent skill from the skills directory.',
        parameters: {
          type: 'object',
          properties: {
            skill_name: { type: 'string', description: 'Name of the skill folder' },
            args: { type: 'object', description: 'Arguments for the skill' }
          },
          required: ['skill_name']
        }
      },
      handler: async (args) => {
        const skillPath = path.join(workspace, 'skills-main', 'skills', args.skill_name, 'SKILL.md')
        if (!fs.existsSync(skillPath)) return `Error: Skill "${args.skill_name}" not found.`
        const instructions = fs.readFileSync(skillPath, 'utf-8')
        return `Skill "${args.skill_name}" loaded. Instructions:\n\n${instructions}`
      }
    })

    console.log('[McpBridge] Registered 10 file/shell/utility tools')
  }

  // ─── HTTP MCP CLIENT (Composio, etc.) ─────────────────────────────────

  async connectHttpMcp(name, config) {
    console.log(`[McpBridge] Connecting to HTTP MCP: ${name} at ${config.url}`)

    this.httpClients.set(name, {
      url: config.url,
      headers: config.headers || {}
    })

    try {
      // Initialize MCP session
      await this.httpRpc(name, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'secure-openclaw-bridge', version: '1.0.0' }
      })

      // Discover tools
      const toolsResult = await this.httpRpc(name, 'tools/list', {})
      const tools = toolsResult?.tools || []

      for (const mcpTool of tools) {
        const toolName = `mcp__${name}__${mcpTool.name}`
        this.registerTool(toolName, {
          source: `http:${name}`,
          mcpToolName: mcpTool.name,
          schema: {
            name: toolName,
            description: mcpTool.description || `Tool from ${name}`,
            parameters: this.convertMcpSchema(mcpTool.inputSchema)
          },
          handler: async (args) => {
            const result = await this.httpRpc(name, 'tools/call', {
              name: mcpTool.name,
              arguments: args
            })
            return this.extractMcpResult(result)
          }
        })
      }

      console.log(`[McpBridge] ${name}: discovered ${tools.length} tools`)
    } catch (err) {
      console.error(`[McpBridge] Failed to connect HTTP MCP ${name}:`, err.message)
    }
  }

  async httpRpc(serverName, method, params, timeoutMs = 30000) {
    const client = this.httpClients.get(serverName)
    if (!client) throw new Error(`HTTP MCP client ${serverName} not found`)

    const body = {
      jsonrpc: '2.0',
      id: this.rpcId++,
      method,
      params
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(client.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...client.headers
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`HTTP MCP ${serverName} returned ${response.status}: ${text.substring(0, 200)}`)
      }

      const contentType = response.headers.get('content-type') || ''

      // Handle SSE responses (Composio uses Server-Sent Events)
      if (contentType.includes('text/event-stream')) {
        return this.parseSSEResponse(response)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`MCP error: ${result.error.message || JSON.stringify(result.error)}`)
      }

      return result.result
    } finally {
      clearTimeout(timeout)
    }
  }

  async parseSSEResponse(response) {
    // Read the SSE stream with a timeout - collect all data events
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let lastData = null
    const startTime = Date.now()
    const maxWaitMs = 25000

    try {
      while (true) {
        if (Date.now() - startTime > maxWaitMs) break

        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.result) lastData = parsed.result
              else if (parsed.error) throw new Error(parsed.error.message || JSON.stringify(parsed.error))
              else lastData = parsed
            } catch (e) {
              if (e.message?.includes('MCP error') || e.message?.includes('error')) throw e
            }
          }
        }

        // If we got a result, we can stop reading
        if (lastData) break
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        // Timeout - return whatever we have
      } else {
        throw e
      }
    } finally {
      try { reader.cancel() } catch (_) {}
    }

    return lastData
  }

  // ─── STDIO MCP CLIENT (Firecrawl, Blender, etc.) ─────────────────────

  async connectStdioMcp(name, config) {
    console.log(`[McpBridge] Connecting to stdio MCP: ${name} (${config.command} ${(config.args || []).join(' ')})`)

    try {
      const client = new StdioMcpClient(name, config)
      await client.start()
      this.stdioClients.set(name, client)

      // Initialize
      await client.rpc('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'secure-openclaw-bridge', version: '1.0.0' }
      })

      // Send initialized notification
      client.notify('notifications/initialized', {})

      // Discover tools
      const toolsResult = await client.rpc('tools/list', {})
      const tools = toolsResult?.tools || []

      for (const mcpTool of tools) {
        const toolName = `mcp__${name.replace(/-/g, '_')}__${mcpTool.name}`
        this.registerTool(toolName, {
          source: `stdio:${name}`,
          mcpToolName: mcpTool.name,
          schema: {
            name: toolName,
            description: mcpTool.description || `Tool from ${name}`,
            parameters: this.convertMcpSchema(mcpTool.inputSchema)
          },
          handler: async (args) => {
            const result = await client.rpc('tools/call', {
              name: mcpTool.name,
              arguments: args
            })
            return this.extractMcpResult(result)
          }
        })
      }

      console.log(`[McpBridge] ${name}: discovered ${tools.length} tools`)
    } catch (err) {
      console.error(`[McpBridge] Failed to connect stdio MCP ${name}:`, err.message)
    }
  }

  // ─── TOOL REGISTRY ────────────────────────────────────────────────────

  registerTool(name, toolDef) {
    this.tools.set(name, toolDef)
  }

  /**
   * Get all tools as OpenAI function call format
   */
  getOpenAITools() {
    const tools = []
    for (const [name, toolDef] of this.tools) {
      tools.push({
        type: 'function',
        function: {
          name: toolDef.schema.name,
          description: toolDef.schema.description,
          parameters: toolDef.schema.parameters || { type: 'object', properties: {} }
        }
      })
    }
    return tools
  }

  /**
   * Execute a tool by name with given arguments
   */
  async executeTool(name, args) {
    const toolDef = this.tools.get(name)
    if (!toolDef) {
      return `Error: Unknown tool "${name}". Available tools: ${Array.from(this.tools.keys()).join(', ')}`
    }

    try {
      console.log(`[McpBridge] Executing ${name} (${toolDef.source})`)
      const result = await toolDef.handler(args)
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    } catch (err) {
      console.error(`[McpBridge] Tool ${name} failed:`, err.message)
      return `Error executing ${name}: ${err.message}`
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────

  /**
   * Convert MCP inputSchema to OpenAI-compatible JSON Schema
   */
  convertMcpSchema(inputSchema) {
    if (!inputSchema) return { type: 'object', properties: {} }

    // MCP uses standard JSON Schema, which OpenAI also accepts
    const schema = { ...inputSchema }

    // Ensure it has type: object at the top level
    if (!schema.type) schema.type = 'object'
    if (!schema.properties) schema.properties = {}

    // Remove unsupported fields
    delete schema.$schema
    delete schema.additionalProperties

    return schema
  }

  /**
   * Extract readable result from MCP tool response
   */
  extractMcpResult(result) {
    if (!result) return '(no result)'

    // MCP returns { content: [{ type: 'text', text: '...' }] }
    if (result.content && Array.isArray(result.content)) {
      return result.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n') || JSON.stringify(result)
    }

    if (typeof result === 'string') return result
    return JSON.stringify(result, null, 2)
  }

  /**
   * Cleanup all connections
   */
  async cleanup() {
    for (const [name, client] of this.stdioClients) {
      try {
        client.stop()
      } catch (e) {
        console.error(`[McpBridge] Error stopping ${name}:`, e.message)
      }
    }
    this.stdioClients.clear()
    this.httpClients.clear()
    this.tools.clear()
    this.initialized = false
  }
}


/**
 * Stdio MCP Client - communicates with MCP servers via stdin/stdout JSON-RPC
 */
class StdioMcpClient {
  constructor(name, config) {
    this.name = name
    this.config = config
    this.process = null
    this.rpcId = 1
    this.pendingRequests = new Map()
    this.buffer = ''
  }

  async start() {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, ...(this.config.env || {}) }

      this.process = spawn(this.config.command, this.config.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      })

      this.process.on('error', (err) => {
        console.error(`[StdioMcp:${this.name}] Process error:`, err.message)
        reject(err)
      })

      this.process.stderr.on('data', (data) => {
        const msg = data.toString().trim()
        if (msg) console.error(`[StdioMcp:${this.name}] stderr: ${msg.substring(0, 200)}`)
      })

      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString()
        this.processBuffer()
      })

      this.process.on('close', (code) => {
        console.log(`[StdioMcp:${this.name}] Process exited with code ${code}`)
        // Reject all pending requests
        for (const [id, { reject }] of this.pendingRequests) {
          reject(new Error(`Process exited with code ${code}`))
        }
        this.pendingRequests.clear()
      })

      // Give it time to start
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          resolve()
        } else {
          reject(new Error('Process failed to start'))
        }
      }, 2000)
    })
  }

  processBuffer() {
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() // Keep incomplete line

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg = JSON.parse(line)
        if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
          const { resolve, reject } = this.pendingRequests.get(msg.id)
          this.pendingRequests.delete(msg.id)
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)))
          } else {
            resolve(msg.result)
          }
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  }

  async rpc(method, params, timeoutMs = 30000) {
    if (!this.process || this.process.killed) {
      throw new Error(`StdioMcp ${this.name} process not running`)
    }

    const id = this.rpcId++
    const message = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params
    }) + '\n'

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`RPC timeout for ${method} on ${this.name}`))
      }, timeoutMs)

      this.pendingRequests.set(id, {
        resolve: (result) => { clearTimeout(timer); resolve(result) },
        reject: (err) => { clearTimeout(timer); reject(err) }
      })

      this.process.stdin.write(message)
    })
  }

  notify(method, params) {
    if (!this.process || this.process.killed) return
    const message = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params
    }) + '\n'
    this.process.stdin.write(message)
  }

  stop() {
    if (this.process && !this.process.killed) {
      this.process.kill()
    }
  }
}
