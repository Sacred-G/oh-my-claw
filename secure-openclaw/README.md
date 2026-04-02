<p align="center">
  <h1 align="center">Secure OpenClaw</h1>
</p>

<p align="center">
  <a href="https://platform.composio.dev?utm_source=github&utm_medium=gif&utm_campaign=2101&utm_content=secure-openclaw">
    <img src="assets/secure-openclaw.gif" alt="Secure OpenClaw Demo" width="800">
  </a>
</p>

<p align="center">
  <a href="https://docs.composio.dev/tool-router/overview">
    <img src="https://img.shields.io/badge/Composio-Tool%20Router-orange" alt="Composio">
  </a>
  <a href="https://platform.claude.com/docs/en/agent-sdk/overview">
    <img src="https://img.shields.io/badge/Claude-Agent%20SDK-blue" alt="Claude Agent SDK">
  </a>
  <a href="https://github.com/anthropics/claude-code">
    <img src="https://img.shields.io/badge/Powered%20by-Claude%20Code-purple" alt="Claude Code">
  </a>
  <a href="https://x.com/composio">
    <img src="https://img.shields.io/badge/Follow%20on-X-black?logo=x&logoColor=white" alt="Follow on X">
  </a>
</p>

<p align="center">
  A personal 24x7 AI assistant that runs on your messaging platforms. Send a message on WhatsApp, Telegram, Signal, or iMessage and get responses from Claude with full tool access, persistent memory, scheduled reminders, and integrations with 500+ apps.
  <br><br>
  <a href="https://platform.composio.dev?utm_source=github&utm_medium=description&utm_campaign=2101&utm_content=secure-openclaw">
    <b>Get your free API key to get started →</b>
  </a>
</p>

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Deploying Remotely](#deploying-remotely)
- [Providers](#providers)
- [Configuration](#configuration)
- [Messaging Platforms](#messaging-platforms)
- [Tool Approvals](#tool-approvals)
- [Memory System](#memory-system)
- [Scheduling and Reminders](#scheduling-and-reminders)
- [App Integrations](#app-integrations)
- [Commands](#commands)
- [Troubleshooting](#troubleshooting)
- [Directory Structure](#directory-structure)
- [Contributing](#contributing)
- [Resources](#resources)
- [Community](#community)

---

## Requirements

- Node.js 18+
- macOS, Linux, or Windows
- Anthropic API key (`ANTHROPIC_API_KEY`)
- Composio API key (`COMPOSIO_API_KEY`)
- **Claude Code** — required if using the Claude provider
- **Opencode** — required if using the Opencode provider

Platform-specific:
- WhatsApp: a phone with WhatsApp installed
- Telegram: a bot token from @BotFather
- Signal: signal-cli installed and registered
- iMessage: macOS only, requires the `imsg` CLI tool

---

## Installation

### 1. Clone and install dependencies

```bash
git clone <repo-url> secure-openclaw
cd secure-openclaw
npm install
```

### 2. Install a provider

You need at least one AI provider installed on the machine.

**Claude Code** (for the Claude provider):

```bash
npm install -g @anthropic-ai/claude-code
```

**Opencode** (for the Opencode provider):

```bash
curl -fsSL https://opencode.ai/install | bash
```

You can install both. The CLI lets you switch between them.

After installing Claude Code, authenticate it locally:

```bash
claude
# Follow the OAuth prompts to log in with your Anthropic account
```

On remote/Docker deployments, authentication is handled by the `ANTHROPIC_API_KEY` environment variable instead — no interactive login needed.

### 3. API keys

**Anthropic** — get your key from https://console.anthropic.com/

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**Composio** — provides 500+ app integrations (Gmail, Slack, GitHub, etc.)

```bash
curl -fsSL https://composio.dev/install | bash
composio login
composio whoami   # shows your API key
export COMPOSIO_API_KEY=your-key
```

Add all exports to your shell profile (`~/.zshrc` or `~/.bashrc`) to make them permanent.

---

## Quick Start

```bash
node cli.js
```

This opens the interactive menu:

```
1) Terminal chat      — talk to the assistant in your terminal
2) Start gateway      — run the messaging gateway
3) Setup adapters     — configure WhatsApp, Telegram, etc.
4) Show current config
5) Test connection
6) Change provider
7) Exit
```

Or run directly:

```bash
node cli.js chat     # terminal chat
node cli.js start    # start the gateway
```

---

## Deploying Remotely

The gateway can run on a remote server. Terminal chat is local only.

### DigitalOcean (Recommended)

A $6/month DigitalOcean droplet. No ID verification, just sign up and go.

#### 1. Create a droplet

1. Sign up at [digitalocean.com](https://www.digitalocean.com/)
2. **Create** > **Droplets**
3. Pick a region, select **Ubuntu 24.04**, choose the **$6/mo** plan (1 GB RAM)
4. Set a **root password**
5. Click **Create Droplet** and copy the **public IP** from the dashboard

#### 2. Set up the server

```bash
# SSH in
ssh root@YOUR_DROPLET_IP

# Add swap (the build needs more than 1 GB)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone the repo (use a GitHub PAT if private)
git clone https://github.com/YOUR_USERNAME/secure-openclaw.git
cd secure-openclaw
```

#### 3. Add your keys

```bash
cp .env.example .env
nano .env
```

Fill in `ANTHROPIC_API_KEY`, `COMPOSIO_API_KEY`, and whichever platforms you want. Save with `Ctrl+O`, exit with `Ctrl+X`.

#### 4. Deploy

```bash
docker compose up -d --build
ufw allow 4096
```

That's it. Docker Compose reads your `.env`, builds the image (installs Claude Code + Opencode inside), and starts the gateway. WhatsApp auth and memory are persisted in Docker volumes automatically.

#### 5. Connect WhatsApp

Open `http://YOUR_DROPLET_IP:4096/qr` in your browser and scan with WhatsApp > Linked Devices.

#### After deploy

```bash
docker compose logs -f                          # live logs
docker compose down && docker compose up -d      # restart
docker compose exec openclaw sh                  # shell into container
git pull && docker compose up -d --build         # update
```

- **Health check:** `http://YOUR_DROPLET_IP:4096/`
- **Telegram:** works immediately if you set `TELEGRAM_BOT_TOKEN` in `.env`

#### Troubleshooting deployment

**Build gets killed (exit code 137):** Out of memory. Make sure you added swap (step 2).

**Can't access `http://YOUR_IP:4096`:** Run `ufw allow 4096`. Also make sure you're using the **public IP** from the DigitalOcean dashboard, not the internal/private one (starts with `10.`).

**WhatsApp QR page says "Waiting...":** The gateway is still starting. Check logs with `docker compose logs -f` and wait for `[Gateway] Ready`.

**Claude exits with code 1:** Your `ANTHROPIC_API_KEY` is missing or wrong. Check with `docker compose exec openclaw env | grep ANTHROPIC`.

**Private repo clone fails:** GitHub doesn't support password auth. Use a Personal Access Token: `git clone https://YOUR_TOKEN@github.com/...`

**Checking logs:**

```bash
docker compose logs -f                          # all logs, live
docker compose logs -f --tail 50                # last 50 lines, then follow
docker compose logs openclaw 2>&1 | grep ERROR  # filter for errors
```

### Other VPS providers

Any Linux VPS works (Hetzner, Vultr, AWS Lightsail). Same steps — SSH in, add swap if < 2 GB RAM, install Docker, clone, `docker compose up`.

### What Runs Where

| Feature | Local | Remote |
|---------|-------|--------|
| Terminal chat | Yes | No |
| Gateway (WhatsApp, Telegram, etc.) | Yes | Yes |
| Memory | Yes | Yes (needs volume) |
| Cron/reminders | Yes | Yes |
| Composio integrations | Yes | Yes |

---

## Providers

Secure OpenClaw supports two AI providers:

**Claude Agent SDK** — Anthropic's SDK. Uses your `ANTHROPIC_API_KEY`. Requires Claude Code installed. Models: Opus 4.6, Sonnet 4.5, Haiku 4.5.

**Opencode** — open-source alternative. Requires Opencode installed. Runs a local server or connects to an existing one. Models: GPT-5 Nano, Big Pickle, GLM-4.7, Grok Code, MiniMax M2.1.

Switch providers from the CLI menu (option 7) or in `config.js`:

```javascript
agent: {
  provider: 'claude',    // or 'opencode'
}
```

When using Opencode, the provider auto-detects whether a server is already running on the configured port. If one exists, it connects. If not, it starts one.

Use `/model` during terminal chat to switch models within the active provider.

---

## Configuration

All settings live in `config.js`. Edit directly or use the setup wizard.

```javascript
{
  agentId: 'secure-openclaw',

  whatsapp: { enabled: true, allowedDMs: [...], allowedGroups: [...] },
  telegram: { enabled: false, token: '', ... },
  signal:   { enabled: false, phoneNumber: '', ... },
  imessage: { enabled: false, ... },

  agent: {
    workspace: '~/secure-openclaw',
    maxTurns: 100,
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    provider: 'claude',
    opencode: {
      model: 'opencode/gpt-5-nano',
      hostname: '127.0.0.1',
      port: 4096
    }
  },

}
```

### Security

Each platform has an allowlist for DMs and groups. Set to `['*']` to allow all, or list specific IDs.

```javascript
whatsapp: {
  allowedDMs: ['+1234567890'],     // only this number can DM
  allowedGroups: ['*'],            // all groups allowed
  respondToMentionsOnly: true      // in groups, only respond when @mentioned
}
```

Messages from unrecognized senders are silently dropped.

---

## Messaging Platforms

### WhatsApp

Uses QR code authentication. No bot token needed.

1. Enable in config or run the setup wizard
2. Start the gateway
3. Scan the QR code that appears in your terminal (WhatsApp > Settings > Linked Devices)
4. Session saves to `auth_whatsapp/` — you only scan once

### Telegram

1. Message @BotFather on Telegram, send `/newbot`, copy the token
2. Add the token to config:

```javascript
telegram: {
  enabled: true,
  token: 'YOUR_BOT_TOKEN',
  allowedDMs: ['*'],
}
```

3. Start the gateway, then message your bot

### Signal

Requires signal-cli to be installed and registered.

```bash
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify CODE
```

Then configure:

```javascript
signal: {
  enabled: true,
  phoneNumber: '+1234567890',
  signalCliPath: 'signal-cli',
}
```

### iMessage

macOS only. Requires the `imsg` CLI tool.

```bash
brew install steipete/formulae/imsg
```

Enable in config. Make sure Messages.app is open and signed in.

---

## Tool Approvals

The gateway runs with permission mode `default`, which means the assistant asks for approval before using certain tools. When a tool needs approval:

**In terminal chat:** the spinner pauses, the tool name and details are printed, and you type `y` or `n` to approve or deny.

**On messaging platforms:** the assistant sends you a message like "Claude wants to use Bash. Reply Y to allow, N to deny." Your next reply resolves the approval.

If the assistant uses `AskUserQuestion` to ask clarifying questions, these are formatted as numbered options. Reply with a number or type your answer.

Approvals time out after 2 minutes with no response.

---

## Memory System

Persistent memory stored at `~/secure-openclaw/`.

```
~/secure-openclaw/
  MEMORY.md              — long-term: preferences, people, decisions
  memory/
    YYYY-MM-DD.md        — daily logs
    [topic].md           — topic-specific notes
```

Memory is loaded at the start of each conversation. The assistant writes to memory when you ask it to remember something. It does not proactively write memory on every message.

Use the `/memory` command in chat to view or search memories.

---

## Scheduling and Reminders

The assistant can schedule messages using cron tools.

- "Remind me in 30 minutes to check the oven" — one-time delay
- "Every day at 9am, send me a standup reminder" — cron expression `0 9 * * *`
- "Every weekday at 8am" — cron expression `0 8 * * 1-5`

Jobs persist in `~/.secure-openclaw/cron-jobs.json` and execute while the gateway is running.

---

## App Integrations

Composio provides access to 500+ apps:

- Gmail, Google Calendar, Google Sheets, Google Drive
- Slack, Discord
- GitHub, GitLab, Jira, Linear
- Notion, Trello, Asana
- Salesforce, HubSpot
- Twitter/X, LinkedIn
- And many more

Just ask: "Send an email to john@example.com", "Create a GitHub issue for the login bug", "Add an event to my calendar for tomorrow at 3pm".

On first use of an app, Composio provides an auth link. Click it to authorize, then the assistant can use that app going forward.

---

## Commands

### CLI

```bash
node cli.js              # interactive menu
node cli.js chat         # terminal chat
node cli.js start        # start gateway
node cli.js setup        # setup wizard
node cli.js config       # show config
node cli.js help         # help
```

### In Chat

| Command | Description |
|---------|-------------|
| `/new`, `/reset` | Start a fresh conversation |
| `/status` | Show session info |
| `/memory` | Show memory summary |
| `/memory list` | List all memory files |
| `/memory search <query>` | Search memories |
| `/model` | Switch model (terminal only) |
| `/queue` | Message queue status |
| `/stop` | Stop current operation |
| `/help` | Show commands |

---

## Troubleshooting

**"ANTHROPIC_API_KEY not set"** — export the key in your shell or `.env` file.

**"claude: command not found"** — Claude Code is not installed. Run `curl -fsSL https://claude.ai/install.sh | bash`.

**"opencode: command not found"** — Opencode is not installed. Run `curl -fsSL https://opencode.ai/install | bash`.

**Composio not working** — make sure `COMPOSIO_API_KEY` is set. Run `composio login` and `composio whoami` to get your key.

**WhatsApp QR not appearing** — delete `auth_whatsapp/` and restart.

**Telegram bot not responding** — verify the token, make sure you sent `/start` to your bot, check `enabled: true`.

**Signal not working** — verify signal-cli is installed, phone number is registered and includes country code.

**iMessage not working** — macOS only. Check that Messages.app is open, imsg is installed (`which imsg`), and accessibility permissions are granted.

**Opencode server failing** — if port 4096 is already in use from a previous run, kill the old process: `kill $(lsof -ti :4096)`. The provider auto-detects running servers, so usually this resolves itself.

**Memory not persisting on remote** — make sure you have a persistent volume mounted at `/home/claw/secure-openclaw`.

---

## Directory Structure

```
secure-openclaw/
  config.js              configuration
  cli.js                 CLI entry point (menu, terminal chat)
  gateway.js             gateway process (messaging platforms)
  Dockerfile             container build for remote deployment
  adapters/
    base.js              base adapter class
    whatsapp.js          WhatsApp via Baileys
    telegram.js          Telegram via node-telegram-bot-api
    signal.js            Signal via signal-cli
    imessage.js          iMessage via imsg (macOS)
  agent/
    claude-agent.js      agent with memory, cron, system prompt
    runner.js            queue + run coordinator
  providers/
    base-provider.js     provider interface
    claude-provider.js   Claude Agent SDK provider
    opencode-provider.js Opencode provider
    index.js             provider registry
  memory/
    manager.js           memory file management
  tools/
    cron.js              scheduling tools
    gateway.js           gateway MCP tools (send_message, etc.)
  commands/
    handler.js           slash command handlers
  sessions/
    manager.js           session tracking

~/secure-openclaw/       workspace (created on first use)
  MEMORY.md              long-term memory
  memory/                daily logs and topic files
```

---

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repo
2. Create a branch (`git checkout -b feat/my-feature`)
3. Make your changes and commit (`git commit -m 'Add my feature'`)
4. Push to your branch (`git push origin feat/my-feature`)
5. Open a Pull Request

Please keep PRs focused on a single change. If you're fixing a bug, include steps to reproduce. If you're adding a feature, explain the use case.

---

## Resources

- [Claude Agent SDK Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code](https://github.com/anthropics/claude-code)
- [Composio Docs](https://docs.composio.dev)
- [Composio Tool Router](https://docs.composio.dev/tool-router/overview)
- [Baileys (WhatsApp)](https://github.com/WhiskeySockets/Baileys)

---

## Community

- [Discord](https://discord.gg/composio) — ask questions, share what you've built
- [X / Twitter](https://x.com/composio) — follow for updates
- [GitHub Issues](https://github.com/ComposioHQ/secure-openclaw/issues) — bug reports and feature requests
- [GitHub Discussions](https://github.com/ComposioHQ/secure-openclaw/discussions) — ideas and Q&A

---

## License

MIT
