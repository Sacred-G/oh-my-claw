<p align="center">
  <img src="assets/openclaw-logo.svg" alt="Oh My Claw - Secure OpenClaw agent gateway" width="760">
</p>

<p align="center">
  <a href="secure-openclaw/LICENSE.md"><img alt="License" src="https://img.shields.io/badge/license-MIT-111827"></a>
  <img alt="Node.js" src="https://img.shields.io/badge/node-18%2B-22c55e">
  <img alt="Runtime" src="https://img.shields.io/badge/runtime-Node.js-38bdf8">
  <img alt="Providers" src="https://img.shields.io/badge/providers-Claude%20%7C%20Opencode-f97316">
  <img alt="MCP" src="https://img.shields.io/badge/tools-MCP%20%2B%20Composio-8b5cf6">
</p>

# Oh My Claw

Oh My Claw is a secure, local-first agent gateway built around `secure-openclaw`. It lets one assistant respond across messaging channels while sharing the same provider runtime, memory, tool registry, scheduling system, file sending tools, and app integrations.

This repository is not a generic chatbot demo. The useful part is the gateway architecture: channel adapters normalize messages, the agent runner handles queueing and provider execution, and tools are exposed through a controlled MCP bridge.

> Security note: this repository is public. Keep `.env`, local memory, messaging sessions, Composio auth config, MCP server secrets, uploads, and transcripts out of Git.

## What It Does

- Runs a personal assistant over WhatsApp, Telegram, Signal, iMessage, or terminal chat.
- Supports Claude Agent SDK and Opencode as interchangeable providers.
- Bridges built-in gateway tools, scheduling tools, AppleScript tools, external MCP servers, and Composio app integrations.
- Stores persistent memory in local workspace files.
- Sends images and documents back through connected messaging platforms.
- Includes queue/session handling and permission surfaces for controlling tool access.
- Supports guest Telegram users with a smaller tool surface.
- Includes Docker deployment assets for remote gateway hosting.

## Architecture

```text
Messaging app / terminal
        |
        v
Channel adapter
        |
        v
Gateway queue
        |
        v
Agent runner
        |
        +--> Provider: Claude Agent SDK or Opencode
        +--> MCP bridge: gateway, cron, AppleScript, Composio, external MCP
        +--> Memory manager
        +--> Session manager
```

The important boundary is that channels should stay thin. Platform-specific code belongs in adapters; tool access, memory, provider execution, queueing, and session behavior belong in the shared runtime.

## Repository Layout

```text
.
+-- README.md
+-- assets/
|   +-- openclaw-logo.svg
+-- secure-openclaw/
    +-- cli.js
    +-- config.js
    +-- gateway.js
    +-- Dockerfile
    +-- docker-compose.yml
    +-- adapters/
    +-- agent/
    +-- commands/
    +-- memory/
    +-- providers/
    +-- sessions/
    +-- tools/
    +-- ui/
    +-- skills-main/
```

## Quick Start

```bash
git clone https://github.com/Sacred-G/oh-my-claw.git
cd oh-my-claw/secure-openclaw
npm install
cp .env.example .env 2>/dev/null || touch .env
npm run cli
```

Direct commands:

```bash
npm run chat     # terminal chat
npm start        # start messaging gateway
npm run setup    # adapter setup wizard
npm run cli      # interactive menu
```

## Requirements

| Requirement | Purpose |
| --- | --- |
| Node.js 18+ | Runtime for the gateway and CLI |
| npm | Dependency installation and scripts |
| Anthropic API key or Claude Code auth | Claude provider |
| Opencode | Optional alternative provider |
| Composio API key | Optional app integrations and tool router |
| Docker | Optional remote deployment |
| macOS | Required only for iMessage and AppleScript workflows |

## Environment Options

Create `secure-openclaw/.env` locally. Do not commit it.

| Variable | Required | Description |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | For Claude provider | Anthropic API key for Claude execution |
| `COMPOSIO_API_KEY` | For Composio | Enables Composio tool router sessions |
| `OPENAI_API_KEY` | Optional | Used by voice transcription helper |
| `PORT` | Optional | Gateway HTTP port, defaults to `4096` |
| `WORKSPACE_DIR` | Optional | Overrides the local workspace directory |
| `WHATSAPP_ALLOWED_DMS` | Optional | Comma-separated WhatsApp DM allowlist, or `*` |
| `WHATSAPP_ALLOWED_GROUPS` | Optional | Comma-separated WhatsApp group allowlist, or `*` |
| `TELEGRAM_BOT_TOKEN` | For Telegram | Bot token from BotFather |
| `TELEGRAM_ALLOWED_DMS` | Optional | Comma-separated Telegram user allowlist, or `*` |
| `TELEGRAM_ALLOWED_GROUPS` | Optional | Comma-separated Telegram group allowlist, or `*` |
| `TELEGRAM_GUEST_DMS` | Optional | Telegram users limited to guest tool permissions |
| `IMESSAGE_ALLOWED_DMS` | Optional | iMessage DM allowlist |
| `IMESSAGE_ALLOWED_GROUPS` | Optional | iMessage group allowlist |
| `SIGNAL_PHONE_NUMBER` | For Signal | Registered Signal phone number |
| `SIGNAL_ALLOWED_DMS` | Optional | Signal DM allowlist |
| `SIGNAL_ALLOWED_GROUPS` | Optional | Signal group allowlist |
| `ADMIN_PASSWORD` | Optional | Dashboard password fallback |

## Providers

| Provider | Config value | Notes |
| --- | --- | --- |
| Claude Agent SDK | `claude` | Default provider. Uses the Anthropic/Claude agent tooling. |
| Opencode | `opencode` | Local or self-managed provider runtime. Configured with host, port, and model. |

Provider configuration lives in `secure-openclaw/config.js`:

```js
agent: {
  provider: 'claude',
  maxTurns: 100,
  opencode: {
    model: 'sonnet-4.6',
    hostname: '127.0.0.1',
    port: 4097
  }
}
```

## Channels

| Channel | File | Status | Notes |
| --- | --- | --- | --- |
| Terminal | `cli.js` | Built in | Best for local testing and setup |
| WhatsApp | `adapters/whatsapp.js` | Supported | Uses Baileys and QR authentication |
| Telegram | `adapters/telegram.js` | Supported | Uses bot token and allowlists |
| Signal | `adapters/signal.js` | Supported | Requires `signal-cli` |
| iMessage | `adapters/imessage.js` | macOS only | Requires `imsg` and Messages.app |

Each channel has DM/group allowlists. Use `*` only when you intentionally want broad access.

## Tool Surface

### Built-in Agent Tools

| Tool | Purpose |
| --- | --- |
| `Read` | Read files in the workspace |
| `Write` | Write files |
| `Edit` | Edit existing files |
| `Bash` | Run shell commands |
| `Glob` | Match files by pattern |
| `Grep` | Search files |
| `TodoWrite` | Track task progress |
| `Skill` | Use installed agent skills |
| `AskUserQuestion` | Ask structured follow-up questions |
| `read_pdf` | Extract text from PDFs |

### Gateway MCP Tools

| Tool | Purpose |
| --- | --- |
| `mcp__gateway__send_message` | Send a text message to a chat |
| `mcp__gateway__send_image` | Send an image file |
| `mcp__gateway__send_document` | Send a document or arbitrary file |
| `mcp__gateway__list_platforms` | List connected platforms |
| `mcp__gateway__get_current_context` | Inspect the active platform/chat/session |
| `mcp__gateway__get_queue_status` | Inspect queue state |
| `mcp__gateway__list_sessions` | List active sessions |
| `mcp__gateway__broadcast_message` | Send a message to multiple sessions |

### Scheduling MCP Tools

| Tool | Purpose |
| --- | --- |
| `mcp__cron__schedule_delayed` | Schedule one delayed reminder |
| `mcp__cron__schedule_recurring` | Schedule recurring reminders |
| `mcp__cron__schedule_cron` | Schedule a cron expression |
| `mcp__cron__list_scheduled` | List scheduled jobs |
| `mcp__cron__cancel_scheduled` | Cancel scheduled jobs |

### AppleScript MCP Tools

| Tool | Purpose |
| --- | --- |
| `mcp__applescript__run_script` | Run AppleScript on macOS |
| `mcp__applescript__list_apps` | List running apps |
| `mcp__applescript__activate_app` | Bring an app forward |
| `mcp__applescript__display_notification` | Show a macOS notification |

### Composio Tool Router

| Tool | Purpose |
| --- | --- |
| `mcp__composio__COMPOSIO_SEARCH_TOOLS` | Search available app tools |
| `mcp__composio__COMPOSIO_GET_TOOL_SCHEMAS` | Fetch input schemas for tool slugs |
| `mcp__composio__COMPOSIO_MULTI_EXECUTE_TOOL` | Execute one or more app tools |
| `mcp__composio__COMPOSIO_MANAGE_CONNECTIONS` | Manage OAuth connections |
| `mcp__composio__COMPOSIO_WAIT_FOR_CONNECTIONS` | Wait for connection authorization |
| `mcp__composio__COMPOSIO_REMOTE_WORKBENCH` | Run remote Python data processing |
| `mcp__composio__COMPOSIO_REMOTE_BASH_TOOL` | Run remote bash workflows |

Typical connected app categories include email, calendar, docs, spreadsheets, GitHub, project management, CRM, messaging, storage, image/video services, and browser/workbench automation.

### External MCP Servers

Add local MCP server definitions in `secure-openclaw/mcp-servers.json`. This file is ignored by Git because it often contains machine-specific paths or secrets.

## Tool Permissions

Default tool set in `config.js`:

```js
allowedTools: [
  'Read',
  'Write',
  'Edit',
  'Bash',
  'Glob',
  'Grep',
  'TodoWrite',
  'Skill',
  'AskUserQuestion',
  'read_pdf',
  'mcp__gateway__send_message',
  'mcp__gateway__send_image',
  'mcp__gateway__send_document',
  'mcp__composio'
]
```

Guest Telegram users get a reduced set:

```js
guestAllowedTools: [
  'TodoWrite',
  'AskUserQuestion',
  'mcp__gateway__send_message',
  'mcp__gateway__send_image',
  'mcp__gateway__send_document',
  'mcp__composio'
]
```

## Memory

Memory lives in the local workspace and should not be committed.

```text
secure-openclaw/MEMORY.md        # optional local long-term memory
secure-openclaw/memory/*.md      # daily/topic memory notes
```

Tracked source for the memory system lives at `secure-openclaw/memory/manager.js`.

## Deployment

Local:

```bash
cd secure-openclaw
npm install
npm start
```

Docker:

```bash
cd secure-openclaw
docker compose up -d --build
docker compose logs -f
```

For a small VPS, use Docker, set `.env`, expose the gateway `PORT`, and keep auth/session directories on persistent storage.

## Private Files That Must Stay Local

The repo is configured to ignore these by default:

| Path | Why |
| --- | --- |
| `secure-openclaw/.env` | API keys and tokens |
| `secure-openclaw/composio-toolkits.json` | Composio user/auth config |
| `secure-openclaw/mcp-servers.json` | Local MCP paths and secrets |
| `secure-openclaw/auth_whatsapp/` | WhatsApp session credentials |
| `secure-openclaw/transcripts/*.jsonl` | Conversation logs |
| `secure-openclaw/uploads/` | User files and generated files |
| `secure-openclaw/memory/*.md` | Personal memory |
| `secure-openclaw/.curated/`, `.system/`, local skill workspaces | Local skill cache and private skill drafts |

Before pushing, run:

```bash
git status --short --untracked-files=all
git diff --cached --check
```

## Development Commands

| Command | Description |
| --- | --- |
| `npm run cli` | Open the interactive CLI |
| `npm run chat` | Start terminal chat |
| `npm start` | Start the messaging gateway |
| `npm run setup` | Run setup wizard |
| `npm run skills:manifest` | Rebuild the skills manifest |
| `node --check gateway.js` | Syntax-check gateway entry |
| `node --check agent/prompt-builder.js` | Syntax-check prompt builder |

## Self-Improvement

One notable feature: the agent can modify its own code, add new capabilities, and restart itself to deploy updates.

**Self-Improvement Capabilities:**
- Modify agent logic, skills, and configurations
- Add new MCP server integrations
- Create and install new skills using the skill-creator system
- Improve memory system
- Enhance communication handling
- Deploy updates and restart itself if needed

**What It Can Improve:**
- Agent core logic (message handling, routing, context)
- Skills and capabilities (Blender, PDF generation, etc.)
- Memory and learning systems
- Platform integrations (WhatsApp, Telegram, etc.)
- Tool wrappers and automation scripts
- Documentation and self-knowledge

**Safeguards:**
- Explains changes before making them
- Tests in isolated areas first
- Keeps backups or uses Git commits
- Gets approval for major architectural changes

The agent can literally read its own code, identify improvements, implement them, test them, and deploy them.

## Current Status

This is an active personal agent gateway, not a polished SaaS product. The next production-grade improvements should be:

- Add automated tests around adapter normalization, provider routing, MCP bridge behavior, and guest permissions.
- Move sensitive tool execution behind an explicit risk policy and audit log.
- Add first-class dashboard auth instead of relying on a fallback password.
- Document deployment hardening for firewalls, process supervision, backups, and secret rotation.
- Keep channel adapters thin as additional surfaces are added.

## License

MIT. See [secure-openclaw/LICENSE.md](secure-openclaw/LICENSE.md).
