# SPDX-License-Identifier: Apache-2.0

# SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

# Copilot Instructions — ZeroClaw Dashboard

## Project Context

ZeroClaw Dashboard is a Next.js 15 application providing a Linear-inspired dark
UI for managing AI agents orchestrated by the ZeroClaw (OpenClaw) gateway.

## Governance

Follow the Constitution at `askb/zeroclaw-mission-control → .specify/memory/constitution.md`.
All changes must go through analysis-first protocol → PR workflow.

## Code Standards

- TypeScript strict mode
- SPDX Apache-2.0 headers on all files
- Tailwind CSS v4 with custom CSS variables (see `app/globals.css`)
- Lucide React for icons (no other icon libraries)
- Components in `components/` — pages in `app/`
- Types in `lib/types.ts`

## Styling

Uses CSS custom properties for theming (not Tailwind config). Colors:

- `--color-bg-primary`: #0a0a0f (darkest)
- `--color-bg-secondary`: #111118
- `--color-accent`: #5b5bff (Linear-like purple-blue)
- See `app/globals.css` for full palette

## Do NOT

- Import from external CDNs
- Add analytics or tracking
- Expose gateway tokens in client-side code
- Use `any` type
- Skip SPDX headers
