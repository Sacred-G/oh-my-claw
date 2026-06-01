---
name: app-research-architect
description: Research and architect modern professional apps before implementation. Use when the user wants to build an app/program and needs GitHub repo inspiration, competitor/paid-app UI research with screenshots, latest library/tooling recommendations, MCP server/tool discovery, AI/voice/video/agent architecture, animated UI direction, memory/database design, parallel-processing plans, or handoff instructions for Codex, Windsurf, VSCode, or similar coding agents/IDEs.
---

# App Research Architect

## Goal

Turn a rough app idea into a research-backed build plan using current GitHub projects, paid/commercial app references, modern libraries, MCP tools, and implementation handoffs for coding agents/IDEs.

## Default Workflow

1. Clarify the product target only if required: app type, platform, audience, must-have features, preferred stack, budget, auth/database needs, and whether web browsing/screenshots are allowed.
2. Research in parallel when tools allow it:
   - GitHub inspiration: newer, starred, active, mature repos.
   - Commercial/paid apps: UI flows, layout patterns, pricing pages, onboarding, dashboards, animation style.
   - Libraries/frameworks: official docs, recent release notes, package health, examples.
   - MCP servers/tools: available integrations, agent workflows, browser/app automation options.
3. Score findings using the selection rubric below.
4. Propose a professional architecture: frontend, backend, AI layer, agents, voice/video, database, memory, background jobs, deployment, observability, and security.
5. Produce an implementation handoff: repo links, screenshots/notes, feature matrix, recommended stack, folder structure, milestones, prompts/tasks for Codex/Windsurf/VSCode, risks, and next actions.

## GitHub Research Criteria

Prefer repos that are useful as inspiration, not just popular:

- Stars: strong signal for the niche, but avoid old abandoned repos.
- Activity: pushed within the last 6-12 months; recent releases/issues/PRs are better.
- Maturity: documentation, examples, tests, typed code, package releases, active maintainers.
- Novelty: newer frameworks, agentic patterns, realtime/voice/video, MCP, animation, 3D, AI UX.
- Applicability: architecture and UX patterns that map to the user's app idea.
- License: compatible if code reuse is considered; otherwise mark as inspiration only.

Use `scripts/github_repo_research.py` for quick GitHub searches when a direct API/gh tool is unavailable. Use GitHub search queries like:

- `topic:ai-agent stars:>500 pushed:>2025-01-01`
- `remotion dashboard stars:>100 pushed:>2025-01-01`
- `livekit voice agent stars:>100 pushed:>2025-01-01`
- `mcp server typescript stars:>100 pushed:>2025-01-01`
- `shadcn dashboard motion stars:>100 pushed:>2025-01-01`

## Commercial UI Research

When researching paid apps or competitors:

- Capture screenshots when permitted and useful: landing page, onboarding, dashboard, core workflow, settings, pricing.
- Extract layout patterns: navigation, density, cards/tables, empty states, command menus, realtime indicators, timeline/canvas views.
- Extract interaction ideas: transitions, microinteractions, drag/drop, multiplayer presence, voice controls, animated onboarding.
- Do not copy proprietary assets or exact designs; synthesize patterns and create an original direction.
- Save screenshot paths and cite source URLs in the handoff.

Prefer browser automation/screenshot skills or Composio browser tools when available. Use Firecrawl/search/scrape for page content and Playwright/browser tools for visual flows.

## Modern Stack Radar

Read references only when relevant:

- `references/feature-radar.md`: current libraries and feature ideas to consider.
- `references/architecture-patterns.md`: agents, MCP, memory, databases, background jobs, and deployment patterns.
- `references/ui-animation-patterns.md`: shadcn, Tailwind, GSAP, Motion, Three.js, Catmull-Rom, Remotion, and animated UI patterns.
- `references/ide-handoff.md`: how to package work for Codex, Windsurf, VSCode, Cursor, or other agents.

## Recommended Output Format

Create a concise but actionable Markdown report:

1. Product interpretation
2. Research summary
3. GitHub inspiration table: repo, stars, last activity, why it matters, reusable patterns
4. Commercial UI inspiration: app/site, screenshot path if any, layout ideas, animation ideas
5. Recommended feature set: MVP, pro, wow-factor
6. Technical architecture
7. AI/agent/MCP plan
8. Memory/database plan: short-term memory, long-term memory, vector search, relational data, cache, files
9. UI/animation direction
10. Implementation plan: milestones, tasks, acceptance checks
11. IDE/agent handoff prompts for Codex/Windsurf/VSCode
12. Risks and validation checklist

Use `scripts/create_research_report.py` to generate a report scaffold.

## Quality Bar

- Prefer official docs and active repos over blog-only recommendations.
- Cite URLs for all major claims and inspirations.
- Distinguish “use this library” from “study this repo for ideas.”
- Include alternatives when tradeoffs matter.
- Favor professional production features: auth, billing, teams, permissions, audit logs, analytics, error tracking, background jobs, backups, rate limits, security, deployment, CI, tests.
- Recommend animated/advanced UI only when it improves the product, not as decoration.
