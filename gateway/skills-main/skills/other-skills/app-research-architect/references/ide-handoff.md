# IDE and Coding Agent Handoff

## Handoff Package

For Codex, Windsurf, VSCode, Cursor, or other coding agents, produce:

- Product brief and user stories.
- Chosen stack and rationale.
- Repo inspirations with links and patterns to study.
- UI inspiration with screenshots/URLs and original design direction.
- Architecture diagram in text or Mermaid.
- Database schema draft.
- Folder structure.
- Milestone task list with acceptance criteria.
- Setup commands and environment variables.
- Testing, linting, and deployment plan.

## Prompt Template

Use this for the builder agent:

You are implementing [APP NAME]. Read the attached research brief first. Build the app using [STACK]. Follow the milestones in order. Keep changes small and verified. After each milestone, run lint/tests/build, summarize changed files, and identify blockers. Preserve the architecture decisions and cite the research brief when choosing libraries or patterns.

## VSCode/Windsurf Setup Suggestions

- Create `.vscode/extensions.json` with recommended extensions.
- Create `.vscode/settings.json` for format-on-save, linting, Tailwind, TypeScript.
- Add `AGENTS.md` or `CLAUDE.md`/`CODEX.md` with project rules.
- Add `docs/research.md`, `docs/architecture.md`, `docs/tasks.md`.
- Add scripts: `dev`, `build`, `lint`, `test`, `typecheck`, `db:migrate`.
