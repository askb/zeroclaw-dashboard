<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com> -->

# ZeroClaw Dashboard

[![Lint](https://github.com/askb/zeroclaw-dashboard/actions/workflows/lint.yaml/badge.svg)](https://github.com/askb/zeroclaw-dashboard/actions/workflows/lint.yaml)
[![Build](https://github.com/askb/zeroclaw-dashboard/actions/workflows/build.yaml/badge.svg)](https://github.com/askb/zeroclaw-dashboard/actions/workflows/build.yaml)
[![Security Audit](https://github.com/askb/zeroclaw-dashboard/actions/workflows/security-audit.yaml/badge.svg)](https://github.com/askb/zeroclaw-dashboard/actions/workflows/security-audit.yaml)

Linear-inspired dark dashboard for ZeroClaw Mission Control — AI agent
orchestration, task management, and real-time monitoring.

<!-- TODO: Add screenshot -->
<!-- ![Dashboard Screenshot](docs/screenshot.png) -->

## Features

| Screen       | Shortcut | Description                                       |
| ------------ | -------- | ------------------------------------------------- |
| **Tasks**    | `g t`    | Kanban board with 4 columns + live activity feed  |
| **Calendar** | `g c`    | Cron jobs and scheduled tasks on a monthly grid   |
| **Projects** | `g p`    | Goal tracking with AI reverse prompting           |
| **Memory**   | `g m`    | Searchable daily journal of agent memory          |
| **Docs**     | `g d`    | Centralized documentation repository browser      |
| **Team**     | `g e`    | Agent org chart with mission statement            |
| **Office**   | `g o`    | 2D pixel-art visualization of agent activity      |
| **Settings** | `g s`    | Dashboard configuration and preferences           |

## Quick Start

### Prerequisites

- **Node.js** 22+
- **pnpm** 9+

### Setup

```bash
git clone https://github.com/askb/zeroclaw-dashboard.git
cd zeroclaw-dashboard
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

The dashboard is designed to run as part of the
[ZeroClaw Mission Control](https://github.com/askb/zeroclaw-mission-control)
stack via Docker Compose:

```bash
# From the mission-control repository
git clone https://github.com/askb/zeroclaw-mission-control.git
cd zeroclaw-mission-control
docker compose up -d
```

To build the standalone Docker image:

```bash
docker build -t zeroclaw-dashboard .
docker run -p 3000:3000 zeroclaw-dashboard
```

## Architecture

### App Router Structure

```
app/              # Pages (one directory per screen)
components/       # Reusable UI components
lib/              # Types, gateway client, utilities
public/sprites/   # Pixel art assets
```

### API Routes

All API routes return JSON with a `source` field indicating data origin:

| Route           | Method | Description                      |
| --------------- | ------ | -------------------------------- |
| `/api/agents`   | GET    | List AI agents and their status  |
| `/api/tasks`    | GET    | Task list with filters           |
| `/api/memory`   | GET    | Agent memory journal entries     |
| `/api/docs`     | GET    | Documentation repository listing |
| `/api/calendar` | GET    | Scheduled tasks and cron jobs    |
| `/api/gateway`  | GET    | Gateway connection status        |

Each response includes `source: "live" | "mock"` to indicate whether data
comes from the live gateway or local mock data.

### Gateway Connection

The dashboard connects to the ZeroClaw gateway via WebSocket for real-time
updates. When the gateway is unavailable, the dashboard falls back to mock data
seamlessly.

## Keyboard Shortcuts

| Shortcut | Action          |
| -------- | --------------- |
| `g t`    | Go to Tasks     |
| `g c`    | Go to Calendar  |
| `g p`    | Go to Projects  |
| `g m`    | Go to Memory    |
| `g d`    | Go to Docs      |
| `g e`    | Go to Team      |
| `g o`    | Go to Office    |
| `g s`    | Go to Settings  |
| `?`      | Show help       |

## CI/CD

| Workflow                 | Trigger                | Description                          |
| ------------------------ | ---------------------- | ------------------------------------ |
| **Lint**                 | push, PR               | ESLint, TypeScript check, pre-commit |
| **Build**                | push, PR               | Next.js build + Docker image build   |
| **Security Audit**       | push, PR, weekly cron  | pnpm audit + detect-secrets scan     |
| **Semantic PR**          | PR open/edit           | Enforce conventional commit titles   |
| **SHA Pinned Actions**   | PR (.github/ changes)  | Verify all actions use SHA pins      |
| **Draft Release**        | push to main           | Auto-draft release notes             |
| **Copilot Auto-assign**  | issue labeled "copilot"| Assign Copilot agent to issues       |
| **Copilot Setup Steps**  | manual, push           | Environment setup for Copilot agent  |

## Development

### Pre-commit Setup

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

### Lint & Build

```bash
pnpm lint          # Run ESLint
npx tsc --noEmit   # Type check
pnpm build         # Production build
pnpm dev           # Development server
```

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** — App Router, React Server Components
- **[React 19](https://react.dev/)** — UI library
- **[TypeScript](https://www.typescriptlang.org/)** — Strict type checking
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first CSS with custom dark theme
- **[Lucide React](https://lucide.dev/)** — Icon library
- **[pnpm](https://pnpm.io/)** — Fast, disk-efficient package manager

## Governance

Follows the [ZeroClaw Constitution](https://github.com/askb/zeroclaw-mission-control).
All changes through PR workflow. SPDX Apache-2.0 headers required.

## License

Apache-2.0
