import path from 'path'
import { fileURLToPath } from 'url'

const parseList = (env) => env ? env.split(',').map(s => s.trim()).filter(Boolean) : []

// Resolve workspace to the project root (where this config file lives) so the
// agent can access local resources like skills-main/, memory/, uploads/, etc.
// Can be overridden with WORKSPACE_DIR env var.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = process.env.WORKSPACE_DIR || __dirname

// Propagate to SECURE_OPENCLAW_WORKSPACE so modules like memory/manager.js
// that read it at import time see the same workspace. config.js is imported
// before those modules, so this assignment wins.
if (!process.env.SECURE_OPENCLAW_WORKSPACE) {
  process.env.SECURE_OPENCLAW_WORKSPACE = WORKSPACE
}

export default {
  agentId: 'secure-openclaw',
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
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'TodoWrite', 'Skill', 'AskUserQuestion', 'read_pdf', 'mcp__gateway__send_message', 'mcp__gateway__send_image', 'mcp__gateway__send_document'],
    provider: 'claude',          // 'claude' or 'opencode'
    opencode: {
      model: 'opencode/gpt-5-nano',
      hostname: '127.0.0.1',
      port: 4097
    }
  }
}
