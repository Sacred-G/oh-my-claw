<p align="center">
  <img src="assets/oh-my-claw-header.jpg" alt="Oh My Claw — Data Pinching & Code Synthesis Library" width="100%" />
</p>

<h1 align="center">🦀 Oh My Claw</h1>

<p align="center">
  <b>Data Pinching & Code Synthesis Library · v2.6</b><br/>
  <i>The art of unstoppable data manipulation.</i>
</p>

<p align="center">
  <a href="https://github.com/sacred-g/oh-my-claw"><img src="https://img.shields.io/badge/branch-main-blue" alt="branch" /></a>
  <img src="https://img.shields.io/badge/commits-641-success" alt="commits" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node" />
</p>

---

## Overview

Oh My Claw is a multi-channel agent gateway that connects messaging platforms (WhatsApp, Telegram, iMessage, Signal) to a Claude-powered agent runtime with persistent memory, scheduling, skills, and 500+ app integrations via Composio.

It is built around a **self-improving model** capable of memory-based coding, auto-patching, and self-restarting after applying updates to its own codebase.

## Core Innovation: Self-Improving Model

- **Memory-Based Coding** — Updates code from file-backed memory.
- **Auto-Patching** — Applies updates to its own codebase.
- **Self-Restarting** — Automatically restarts the server post-patch.

## Key Project Elements

- **Multi-Channel Normalize** — Connects messaging to the agent runtime.
- **Gateway Tools** — Send messages, images, and documents across platforms.
- **Provider Support** — Claude, OpenAI, OpenCode.
- **Deeper Integration** — Composio for external app actions (Gmail, Slack, GitHub, Notion, and more).
- **Persistent State** — File-backed memory, session history, scheduled tasks.
- **Crushing Deadlocks** — Precision data selection and a shell-based API.
- **Code Synthesis (MCP)** — `mcp_gateway_generate_code`.

## Features

- 🤖 Claude Agent SDK runtime with tools, skills, and memory
- 💬 Adapters for WhatsApp, Telegram, iMessage, Signal
- 🧠 Long-term memory (`MEMORY.md`) + daily logs
- 🗓️ Cron-based scheduling and reminders
- 🛠️ 500+ app integrations via Composio toolRouter
- 🎨 Skills system (PDF, DOCX, XLSX, PPTX, Blender, web builders, and more)
- 🖼️ Image generation + media send/receive
- 🍎 macOS AppleScript automation
- 🧱 Blender 3D control via MCP

## Installation

```bash
git clone https://github.com/sacred-g/oh-my-claw.git
cd oh-my-claw
npm install
npm run setup
```

## Usage

Start the gateway:

```bash
npm start
```

Chat in the terminal:

```bash
npm run chat
```

Rebuild the skills manifest:

```bash
npm run skills:manifest
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Messaging Platforms                             │
│  WhatsApp · Telegram · iMessage · Signal         │
└──────────────────────┬───────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Adapters Layer │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Gateway Core   │  ◀── Memory · Sessions · Cron
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Agent Runtime  │  ◀── Claude / OpenAI / OpenCode
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Skills        Composio MCP    Blender MCP
   (PDF, DOCX,   (500+ apps:     (3D scene
    PPTX, etc.)   Gmail, Slack,   control)
                  GitHub, etc.)
```

## Project Structure

```
oh-my-claw/
├── adapters/          # Platform adapters (WhatsApp, Telegram, …)
├── agent/             # Agent runtime
├── assets/            # Branding assets
├── blender-skills/    # Blender 3D control
├── commands/          # CLI commands
├── memory/            # Daily logs (append-only)
├── providers/         # Model providers
├── scripts/           # Utility scripts
├── skills-main/       # Skill catalog
├── MEMORY.md          # Long-term memory
├── gateway.js         # Gateway entry point
└── cli.js             # CLI entry point
```

## License

MIT — see [LICENSE.md](LICENSE.md).

---

<p align="center">
  <i>// The art of unstoppable data manipulation.</i><br/>
  <b>Repository:</b> <a href="https://github.com/sacred-g/oh-my-claw">github.com/sacred-g/oh-my-claw</a>
</p>
