# SPDX-License-Identifier: Apache-2.0

# SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

# ZeroClaw Dashboard — Agent Guide

## Overview

This is the ZeroClaw Mission Control custom dashboard — a Next.js 15 app with
a Linear-inspired dark theme for managing AI agents and tasks.

## Governance

This repository follows the ZeroClaw Constitution located at:
`askb/zeroclaw-mission-control → .specify/memory/constitution.md`

Key rules:

- **Analysis-first**: Read before writing. Propose before executing.
- **PR-only**: All changes via branch + PR. Never push to main.
- **SPDX headers**: Every file needs `Apache-2.0` header.
- **Conventional commits**: `feat:`, `fix:`, `docs:`, etc. with sign-off.

## Architecture

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4 with custom dark theme
- **Icons**: Lucide React
- **Data**: WebSocket from ZeroClaw gateway + local file reads

## File Conventions

- `app/` — Pages (one directory per screen)
- `components/` — Reusable UI components
- `lib/` — Utilities, types, gateway client
- `public/` — Static assets (sprites, icons)

## Development

```bash
pnpm dev     # Start dev server at localhost:3000
pnpm build   # Production build
pnpm lint    # ESLint check
```
