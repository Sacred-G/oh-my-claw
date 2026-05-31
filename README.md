<p align="center">
  <img src="assets/openclaw-logo.svg" alt="Oh My Claw agent gateway" width="760">
</p>

<p align="center">
  <a href="gateway/LICENSE.md"><img alt="License" src="https://img.shields.io/badge/license-MIT-111827"></a>
  <img alt="Node.js" src="https://img.shields.io/badge/node-18%2B-22c55e">
  <img alt="Gateway" src="https://img.shields.io/badge/gateway-Node.js-38bdf8">
  <img alt="Dashboard" src="https://img.shields.io/badge/dashboard-Next.js-000000">
  <img alt="Providers" src="https://img.shields.io/badge/providers-Claude%20%7C%20Opencode%20%7C%20OpenAI-f97316">
</p>

# Oh My Claw

Oh My Claw is currently a local-first personal agent gateway. The source
package lives under `gateway/`, while the runtime identity, package name, CLI
command, agent IDs, Docker workspace, and state paths are named `oh-my-claw`.
It connects messaging channels to one shared agent runtime with providers,
memory files, MCP-style tools, scheduling, uploads, Composio integrations, and
a Next.js dashboard.

This repository is **not yet** the production-grade cognitive runtime described
in the project instructions. The current implementation is a working Node.js
gateway. The target architecture is stricter: channels should be dumb I/O, and
all reasoning, tools, memory, approvals, audit, and workflow behavior should
eventually move behind a core-authoritative runtime.

## Current Status

Implemented now:

- Node.js gateway in `gateway/gateway.js`.
- Messaging adapters for WhatsApp, Telegram, Signal, and iMessage.
- Terminal CLI in `gateway/cli.js`.
- Provider layer for Claude Agent SDK, Opencode, and OpenAI.
- File-backed memory through `gateway/memory/manager.js`.
- MCP bridge and built-in tools for gateway messaging, cron, AppleScript, file
  access, uploads, PDFs, and Composio.
- Queue/session handling through `gateway/agent/runner.js` and
  `gateway/sessions/manager.js`.
- Next.js dashboard in `gateway/ui`.
- Docker Compose deployment for the gateway.

Not implemented yet:

- SvelteKit app shell.
- `IncomingTurn` / `runTurn` / `dispatchTool` core boundary.
- Postgres, Drizzle, Redis, pgvector, persisted approvals, or audit event
  storage.
- Phase 2 web text channel SSE endpoint with approval replay.
- Tests for dispatch gating, memory isolation, duplicate skip, and supersede
  behavior.

The README intentionally documents the live project instead of promising the
future Phase 2 slice.

## Architecture

```text
Messaging app / terminal / dashboard proxy
        |
        v
Channel adapter or gateway HTTP endpoint
        |
        v
Gateway queue
        |
        v
Agent runner
        |
        +--> Provider: Claude Agent SDK, Opencode, or OpenAI
        +--> MCP bridge / built-in tools
        +--> File-backed memory manager
        +--> Session manager
        +--> Cron scheduler
```

The current code keeps most shared behavior in the gateway and agent runner,
but it does not yet enforce the desired Phase 2 trust boundary. In particular,
there is no single `dispatchTool` gate or persisted approval system. Sensitive
tools are allowed by the provider/tool configuration, and the gateway currently
constructs the agent with `permissionMode: 'bypassPermissions'`.

That is acceptable for a local personal gateway, but it is not the final
production architecture. The next serious architecture milestone should be the
Phase 2 vertical slice, not more channel breadth.

## Repository Layout

```text
.
+-- README.md
+-- assets/
|   +-- openclaw-logo.svg
+-- gateway/
    +-- cli.js                    # interactive CLI and terminal chat
    +-- config.js                 # gateway/provider/channel config
    +-- gateway.js                # HTTP gateway and messaging adapter host
    +-- Dockerfile
    +-- docker-compose.yml
    +-- adapters/                 # WhatsApp, Telegram, Signal, iMessage
    +-- agent/                    # runner, prompt builder, MCP bridge
    +-- commands/                 # slash command handling
    +-- memory/                   # file-backed memory manager
    +-- providers/                # Claude, Opencode, OpenAI providers
    +-- sessions/                 # session and transcript state
    +-- tools/                    # gateway, cron, AppleScript, uploads, PDF
    +-- ui/                       # Next.js dashboard
    +-- skills-main/              # bundled/local agent skills
```

## Requirements

| Requirement | Purpose |
| --- | --- |
| Node.js 18+ | Gateway, CLI, and dashboard runtime |
| npm | Dependency installation and scripts |
| Anthropic API key or Claude auth | Claude provider |
| Opencode | Optional alternative provider |
| OpenAI API key | Optional OpenAI provider and transcription helper |
| Composio API key | Optional app integrations and tool router |
| Docker | Optional gateway deployment |
| macOS | Required only for iMessage and AppleScript workflows |

## Quick Start

Gateway:

```bash
cd gateway
npm install
touch .env
npm run cli
```

Direct commands:

```bash
npm run chat     # terminal chat
npm start        # start messaging gateway
npm run setup    # adapter setup wizard
npm run cli      # interactive menu
```

Dashboard:

```bash
cd gateway/ui
npm install
cp .env.example .env.local
npm run dev
```

By default the dashboard expects a gateway URL through `GATEWAY_URL`. For a
local gateway, set:

```bash
GATEWAY_URL=http://localhost:4096
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
ADMIN_PASSWORD=replace-me
```

## Environment

Create `gateway/.env` locally. Do not commit it.

| Variable | Required | Description |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | For Claude provider | Anthropic API key for Claude execution |
| `COMPOSIO_API_KEY` | For Composio | Enables Composio tool router sessions |
| `OPENAI_API_KEY` | For OpenAI provider/transcription | OpenAI API key |
| `OPENAI_BASE_URL` | Optional | Custom OpenAI-compatible endpoint |
| `OH_MY_CLAW_PROVIDER` | Optional | Runtime provider: `claude`, `openai`, or `opencode`. Defaults to `claude` |
| `AGENT_PROVIDER` | Optional | Backward-compatible provider override if `OH_MY_CLAW_PROVIDER` is unset |
| `CLAUDE_MODEL` | Optional | Claude model override. Defaults to `opus-4.8` |
| `OPENAI_MODEL` | Optional | OpenAI model override. Defaults to `gpt-5.5` |
| `OPENAI_FALLBACK_MODEL` | Optional | OpenAI model for Claude fallback. Defaults to `OPENAI_MODEL`/configured OpenAI model |
| `OPENAI_IMAGE_MODEL` | Optional | OpenAI image generation model. Defaults to `gpt-image-1.5` |
| `PORT` | Optional | Gateway HTTP port, defaults to `4096` |
| `WORKSPACE_DIR` | Optional | Overrides the project workspace directory |
| `OH_MY_CLAW_WORKSPACE` | Optional | Direct workspace override for memory manager callers |
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

Create `gateway/ui/.env.local` for the dashboard:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | Yes | Secret used by NextAuth |
| `NEXTAUTH_URL` | Recommended | Dashboard URL |
| `GATEWAY_URL` | Yes | Gateway base URL, usually `http://localhost:4096` |
| `ADMIN_PASSWORD` | Recommended | Dashboard password. Defaults to `admin123` if unset |

## Providers

Provider registration lives in `gateway/providers/index.js`.

| Provider | Config value | Notes |
| --- | --- | --- |
| Claude Agent SDK | `claude` | Default provider. Default model: `opus-4.8` |
| Opencode | `opencode` | Uses configured host, port, and model |
| OpenAI | `openai` | Uses Chat Completions and the MCP bridge. Default model: `gpt-5.5` |

Provider selection can be controlled from `gateway/.env`:

```bash
OH_MY_CLAW_PROVIDER=claude
CLAUDE_MODEL=opus-4.8
OPENAI_MODEL=gpt-5.5
```

`gateway/config.js` still contains the fallback defaults and Opencode settings:

```js
agent: {
  provider: parseProvider(process.env.OH_MY_CLAW_PROVIDER || process.env.AGENT_PROVIDER),
  claude: {
    model: process.env.CLAUDE_MODEL || 'opus-4.8'
  },
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-5.5'
  },
  maxTurns: 100,
  opencode: {
    model: 'sonnet-4.6',
    hostname: '127.0.0.1',
    port: 4097
  }
}
```

## Channels

| Channel | File | Notes |
| --- | --- | --- |
| Terminal | `gateway/cli.js` | Best for local testing |
| WhatsApp | `gateway/adapters/whatsapp.js` | Uses Baileys and QR authentication |
| Telegram | `gateway/adapters/telegram.js` | Uses bot token and allowlists |
| Signal | `gateway/adapters/signal.js` | Requires `signal-cli` |
| iMessage | `gateway/adapters/imessage.js` | macOS only, requires `imsg` |
| Dashboard | `gateway/ui` | Next.js app that proxies gateway HTTP APIs |

Each messaging channel has DM/group allowlists. Use `*` only when broad access
is intentional.

## Gateway HTTP API

The gateway exposes lightweight HTTP endpoints for status, dashboard data, QR
auth, and server-sent events:

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Gateway status |
| `GET /qr` | WhatsApp QR page |
| `GET /sessions` | List sessions |
| `GET /sessions/:key` | Session details and transcript |
| `POST /message` | Send a dashboard-originated message into the runner |
| `GET /memory/long-term` | Read long-term memory |
| `GET /memory/daily` | List daily memory files |
| `GET /memory/search?q=...` | Search file-backed memory |
| `POST /memory/update` | Update long-term or daily memory files |
| `GET /integrations` | List connected Composio accounts |
| `GET /integrations/available` | List Composio toolkits |
| `GET /integrations/connect/:app` | Start a Composio connection |
| `GET /config` | Return in-memory config |
| `POST /config/update` | Update in-memory config only |
| `GET /scheduling/jobs` | List cron jobs |
| `GET /stats` | Dashboard stats |
| `GET /events` | Gateway event stream |

These are not the Phase 2 cognitive runtime endpoints. There is no
`POST /api/channels/web` SSE route in the current gateway.

## Tool Surface

Configured host tools in `gateway/config.js` include:

- File and shell tools: `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`.
- Agent utilities: `TodoWrite`, `Skill`, `AskUserQuestion`, `read_pdf`.
- Gateway tools: send messages, images, and documents.
- Composio tools through `mcp__composio`.
- Cron and AppleScript tools are added by the agent runtime when available.

Guest Telegram users get a reduced tool list with no filesystem, shell, host
memory, cron, or AppleScript access.

External MCP server definitions can be added in
`gateway/mcp-servers.json`. That file is ignored because it often
contains local paths or secrets.

## Memory

The current memory system is file-backed, not Postgres/vector-backed.

Tracked source:

```text
gateway/memory/manager.js
```

Runtime memory is local and ignored:

```text
gateway/MEMORY.md
gateway/memory/*.md
gateway/memory/*.json
gateway/memory/*.jsonl
```

## Deployment

Local gateway:

```bash
cd gateway
npm install
npm start
```

Docker gateway:

```bash
cd gateway
docker compose up -d --build
docker compose logs -f
```

Docker Compose reads `gateway/.env`, exposes port `4096`, and persists
WhatsApp auth plus memory in Docker volumes.

## Development Commands

Gateway:

| Command | Description |
| --- | --- |
| `npm run cli` | Open the interactive CLI |
| `npm run chat` | Start terminal chat |
| `npm start` | Start the messaging gateway |
| `npm run setup` | Run setup wizard |
| `npm run skills:manifest` | Rebuild the skills manifest |
| `node --check gateway.js` | Syntax-check gateway entry |

Dashboard:

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build the dashboard |
| `npm run start` | Start the built dashboard |
| `npm run lint` | Run ESLint |

## Private Files

Keep these local:

| Path | Why |
| --- | --- |
| `gateway/.env` | API keys and tokens |
| `gateway/ui/.env.local` | Dashboard secrets |
| `gateway/composio-toolkits.json` | Composio user/auth config |
| `gateway/mcp-servers.json` | Local MCP paths and secrets |
| `gateway/auth_whatsapp/` | WhatsApp credentials |
| `gateway/transcripts/*.jsonl` | Conversation logs |
| `gateway/uploads/` | User files and generated files |
| `gateway/memory/*.md` | Personal memory |
| `gateway/.curated/`, `.system/`, local skill workspaces | Local skill cache and private drafts |

Before pushing:

```bash
git status --short --untracked-files=all
git diff --cached --check
```

## Recommended Next Phase

Do not add more channel-specific intelligence yet. The highest-value next step
is to build a real Phase 2 vertical slice in a clean core runtime:

```text
web text channel
  -> IncomingTurn
  -> runTurn
  -> dispatchTool
  -> approval policy
  -> memory service
  -> audit log
  -> dashboard UI
```

The production target should include:

- A framework-light core where `tool.execute()` is reachable only through
  `dispatchTool`.
- Zod validation on all server inputs.
- Persisted pending approvals and atomic approve/reject replay.
- Duplicate/conflict memory behavior with superseded rows preserved.
- Audit events for every meaningful action.
- Focused tests before adding provider breadth or voice.

## License

MIT. See [gateway/LICENSE.md](gateway/LICENSE.md).
