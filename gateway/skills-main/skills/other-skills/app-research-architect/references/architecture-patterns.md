# Architecture Patterns

## Agent Architecture

- Separate planner, researcher, builder, reviewer, and deployer roles for complex builds.
- Use tool-specific MCP servers instead of brittle scripts when available.
- Use browser automation for competitor screenshots and UI behavior research.
- Use structured outputs for research findings and implementation tasks.
- Add tracing/logging for agent tool calls, costs, and failures.

## Parallel Processing

Parallelize independent tasks:

- GitHub search queries by feature area.
- Competitor page scraping/screenshot capture.
- Library documentation lookups.
- MCP tool discovery.
- Design inspiration and architecture research.

Merge results with deduplication, scoring, and citations.

## Memory Design

Short-term memory:

- Current task state, active plan, open files, temporary browser findings.
- Store in runtime state, Redis, local JSON, or agent thread state.

Long-term memory:

- User preferences, project decisions, reusable research, architecture choices.
- Store in Markdown, Postgres, vector DB, or app database with embeddings.

Memory schema ideas:

- memories: id, user_id, project_id, type, content, source, confidence, created_at, updated_at.
- decisions: id, project_id, decision, rationale, alternatives, status, date.
- research_sources: id, url, title, kind, summary, screenshot_path, tags, score.

## Database Pattern

For most professional web apps:

- Postgres as source of truth.
- Redis for cache/queues/rate limiting.
- Object storage for screenshots, uploads, generated assets.
- Vector index for semantic project memory/RAG if AI search is needed.
- Event table for audit/activity and analytics pipeline.

## MCP Strategy

Look for MCP servers before building custom integrations:

- GitHub/GitLab repo and issue automation.
- Browser/Playwright for competitor research and screenshots.
- Filesystem for local codebase manipulation.
- Database MCP for schema introspection and safe queries.
- Figma/design MCP for design handoff.
- Cloud/deployment MCP for Vercel, Netlify, Cloudflare, Render.

If a tool is missing, recommend building a small MCP server only for stable repeatable operations.
