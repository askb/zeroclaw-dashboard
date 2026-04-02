<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com> -->

# ZeroClaw Dashboard

Linear-inspired dark UI for managing ZeroClaw AI agents and tasks.

## Features

| Screen | Description |
|--------|-------------|
| **Tasks** | Kanban board with 4 columns + live activity feed |
| **Calendar** | Cron jobs and scheduled tasks on a monthly grid |
| **Projects** | Goal tracking with AI reverse prompting |
| **Memory** | Searchable daily journal of agent memory |
| **Docs** | Centralized documentation repository browser |
| **Team** | Agent org chart with mission statement |
| **Office** | 2D pixel-art visualization of agent activity |

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 15+** (App Router)
- **Tailwind CSS v4** (custom dark theme)
- **Lucide React** (icons)
- **TypeScript** (strict)

## Architecture

```
app/              # Pages (one directory per screen)
components/       # Reusable UI components
lib/              # Types, gateway client, utilities
public/sprites/   # Pixel art assets (Phase 6)
```

## Governance

Follows the [ZeroClaw Constitution](https://github.com/askb/zeroclaw-mission-control).
All changes through PR workflow. SPDX Apache-2.0 headers required.

## License

Apache-2.0
