# Oh My Claw Dashboard

This is the Next.js dashboard for the Oh My Claw gateway. It is not the agent
runtime. The dashboard authenticates an operator, proxies requests to the
gateway HTTP API, and renders gateway status, sessions, memory, scheduling,
integrations, and configuration screens.

## Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required:

```bash
NEXTAUTH_SECRET=replace-me
GATEWAY_URL=http://localhost:4096
```

Recommended:

```bash
NEXTAUTH_URL=http://localhost:3000
ADMIN_PASSWORD=replace-me
```

If `ADMIN_PASSWORD` is unset, `auth.ts` falls back to `admin123`. That is only
acceptable for local development.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start a production build |
| `npm run lint` | Run ESLint |

## Project Shape

```text
app/
  (dashboard)/dashboard/        dashboard pages
  api/auth/[...nextauth]/       NextAuth route
  api/proxy/                    authenticated gateway proxy routes
components/
  features/                     app-specific UI
  providers/                    React Query and theme providers
  shared/                       layout components
  ui/                           shadcn-style components
lib/
  api/                          API client
  hooks/                        React Query hooks
  env.ts                        server env validation
```

## Gateway Contract

The UI talks to the gateway through `GATEWAY_URL`. Local development normally
uses:

```bash
GATEWAY_URL=http://localhost:4096
```

The dashboard currently depends on the gateway endpoints documented in
`../README.md`: status, sessions, memory, scheduling, integrations, config,
stats, message, and events.

This dashboard does not yet implement the Phase 2 approval/audit UI described
in the broader project instructions because the backend approval/audit runtime
does not exist in this package yet.
