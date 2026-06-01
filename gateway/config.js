import path from 'path'
import { fileURLToPath } from 'url'

const parseList = (env) => env ? env.split(',').map(s => s.trim()).filter(Boolean) : []
const parseProvider = (env, fallback = 'claude') => {
  const provider = env?.trim().toLowerCase()
  return ['claude', 'openai', 'opencode'].includes(provider) ? provider : fallback
}

// Resolve workspace to the project root (where this config file lives) so the
// agent can access local resources like skills-main/, memory/, uploads/, etc.
// Can be overridden with WORKSPACE_DIR env var.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = process.env.WORKSPACE_DIR || __dirname

// Propagate to OH_MY_CLAW_WORKSPACE so modules like memory/manager.js that read
// it at import time see the same workspace.
if (!process.env.OH_MY_CLAW_WORKSPACE) {
  process.env.OH_MY_CLAW_WORKSPACE = WORKSPACE
}

export default {
  agentId: 'oh-my-claw',
  workspace: WORKSPACE,

  whatsapp: {
    enabled: true,
    allowedDMs: parseList(process.env.WHATSAPP_ALLOWED_DMS),       // phone numbers, or '*' for all
    allowedGroups: parseList(process.env.WHATSAPP_ALLOWED_GROUPS),  // group JIDs
    respondToMentionsOnly: true
  },

  imessage: {
    enabled: true,
    allowedDMs: parseList(process.env.IMESSAGE_ALLOWED_DMS),       // chat IDs, or '*' for all
    allowedGroups: parseList(process.env.IMESSAGE_ALLOWED_GROUPS),
    respondToMentionsOnly: false
  },

  telegram: {
    enabled: true,
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedDMs: parseList(process.env.TELEGRAM_ALLOWED_DMS),       // user IDs, or '*' for all
    allowedGroups: parseList(process.env.TELEGRAM_ALLOWED_GROUPS),
    // Guest user IDs: limited access — chat + their OWN Composio apps only.
    // No filesystem, no shell, no access to host memory/cron.
    guestDMs: parseList(process.env.TELEGRAM_GUEST_DMS),
    respondToMentionsOnly: true
  },

  signal: {
    enabled: false,
    phoneNumber: process.env.SIGNAL_PHONE_NUMBER || '',
    signalCliPath: 'signal-cli',
    allowedDMs: parseList(process.env.SIGNAL_ALLOWED_DMS),         // phone numbers, or '*' for all
    allowedGroups: parseList(process.env.SIGNAL_ALLOWED_GROUPS),
    respondToMentionsOnly: true
  },

  // Agent configuration
  agent: {
    workspace: WORKSPACE,        // Agent workspace directory (absolute path)
    maxTurns: 100,                // Max tool-use turns per message
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'TodoWrite', 'Skill', 'AskUserQuestion', 'read_pdf', 'mcp__gateway__send_message', 'mcp__gateway__send_image', 'mcp__gateway__send_document', 'mcp__composio'],
    // Tools available to GUEST users — chat + their own Composio apps. No filesystem/shell.
    guestAllowedTools: ['TodoWrite', 'AskUserQuestion', 'mcp__gateway__send_message', 'mcp__gateway__send_image', 'mcp__gateway__send_document', 'mcp__composio'],
    provider: parseProvider(process.env.OH_MY_CLAW_PROVIDER || process.env.AGENT_PROVIDER),
    claude: {
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-8'
    },
    openai: {
      model: process.env.OPENAI_MODEL || 'gpt-5.5'
    },
    opencode: {
      model: 'opencode/gpt-5-nano',
      hostname: '127.0.0.1',
      port: 4097
    }
  }
}
