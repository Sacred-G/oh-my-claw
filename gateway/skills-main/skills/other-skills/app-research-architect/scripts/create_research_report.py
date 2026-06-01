#!/usr/bin/env python3
"""Create a Markdown research report scaffold for an app idea."""
import argparse
from pathlib import Path
from datetime import datetime

TEMPLATE = """# App Research and Architecture Brief: {title}

Generated: {date}

## 1. Product Interpretation

- App idea:
- Target users:
- Platform:
- Success criteria:

## 2. Research Summary

-

## 3. GitHub Inspiration

| Repo | Stars | Activity | Pattern to study | URL |
| --- | ---: | --- | --- | --- |
| | | | | |

## 4. Commercial UI Inspiration

| App/Site | Screenshots | Layout/UX ideas | Animation ideas | URL |
| --- | --- | --- | --- | --- |
| | | | | |

## 5. Recommended Features

### MVP
-

### Pro
-

### Wow Factor
-

## 6. Technical Architecture

### Frontend
-

### Backend
-

### AI/Agents
-

### Voice/Realtime/Media
-

### Database and Storage
-

### Deployment and Observability
-

## 7. MCP and Tooling Plan

-

## 8. Memory Plan

### Short-Term Memory
-

### Long-Term Memory
-

## 9. UI and Animation Direction

-

## 10. Implementation Plan

| Milestone | Tasks | Acceptance checks |
| --- | --- | --- |
| 1 | | |
| 2 | | |
| 3 | | |

## 11. Coding Agent Handoff

### Codex/Windsurf/VSCode Prompt

Implement this app from the research brief. Follow milestones in order, keep changes small, run lint/tests/build after each milestone, and summarize changed files and blockers.

## 12. Risks and Validation

-
"""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("title")
    parser.add_argument("--out", default="research-brief.md")
    args = parser.parse_args()
    content = TEMPLATE.format(title=args.title, date=datetime.utcnow().isoformat() + "Z")
    Path(args.out).write_text(content)
    print(Path(args.out).resolve())

if __name__ == "__main__":
    main()
