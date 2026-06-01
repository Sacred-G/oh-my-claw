# Feature Radar

Use this as a checklist while researching modern app ideas. Verify current status with official docs/repo activity before recommending.

## AI and Agents

- OpenAI Agents SDK for tool-using agents, tracing, handoffs, guardrails, and multi-agent workflows.
- OpenAI Realtime API / realtime voice model patterns for low-latency speech UX.
- LiveKit Agents for production voice/video agents, rooms, telephony, and realtime media pipelines.
- Vercel AI SDK for chat/completion UI streaming and model-provider abstractions.
- LangGraph / Mastra / CrewAI / AutoGen-style orchestration when graph/stateful workflows are needed.
- MCP servers for external tools: GitHub, filesystem, browser, database, Slack/Notion/Linear, Figma, Playwright, Docker, cloud providers.

## Video, Media, and Generative UI

- Remotion for programmatic React video rendering, templates, previews, and social/export workflows.
- FFmpeg/WASM or server FFmpeg for media processing.
- TTS/STT pipelines with OpenAI audio, Whisper, realtime transcription, diarization when useful.

## Frontend and UI

- Next.js/React, TanStack Router/Start, SvelteKit, Nuxt, Astro depending on product needs.
- shadcn/ui + Tailwind for composable professional UI.
- Radix UI, Ariakit, Headless UI for accessibility primitives.
- Framer Motion/Motion, GSAP, React Spring for motion.
- Three.js/React Three Fiber/Drei for 3D.
- Catmull-Rom curves for smooth camera paths, node graphs, animated trajectories, timelines, and product visualizations.
- Tiptap/Lexical/Plate for editors.
- React Flow for node-based builders.
- TanStack Query/Table/Virtual/Form for serious app UX.

## Backend, Data, and Infra

- Postgres with Prisma/Drizzle/Kysely; Supabase/Neon/Turso where appropriate.
- Vector search: pgvector, Pinecone, Weaviate, Qdrant, Chroma for RAG/memory.
- Redis/Upstash for queues, cache, rate limits, ephemeral memory.
- Background jobs: Trigger.dev, Inngest, BullMQ, Temporal, Cloudflare Queues.
- Auth/team/billing: Clerk, Auth.js, Better Auth, Stripe, Polar, Lemon Squeezy.
- Observability: Sentry, PostHog, OpenTelemetry, Logtail/Axiom.

## Professional Features to Consider

- Teams/workspaces, roles, permissions, invites.
- Billing, subscriptions, trials, usage limits, metering.
- Audit logs, activity feeds, notifications.
- Import/export, API keys, webhooks, integrations.
- Admin console and user settings.
- Offline/optimistic UI, autosave, command palette.
- Onboarding checklist, templates, examples, empty states.
- Analytics dashboards and feedback collection.
