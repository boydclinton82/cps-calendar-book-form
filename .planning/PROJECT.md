# CPS Calendar Book Form

## What This Is

A multi-instance booking calendar template deployed via Vercel. Each instance allows users to book time slots for shared resources (typically meeting rooms). The admin app creates new instances from this template repo, and all 5 current deployments need to stay in sync.

## Core Value

Users can quickly see availability and book time slots without conflicts.

## Current Milestone: v2.0 Booking Spec Package

**Goal:** Create an exhaustive, AI-optimized specification package that enables another Claude Code (Opus 4.6) instance to perfectly recreate the single booking form in a Rails application.

**Target deliverables:**
- Visual capture of every state/interaction from the deployed version
- Clean reference code extracted from this repo (stripped of dead code)
- Blueprint-level specs: UI, UX, architecture, functionality, edge cases
- Master SPEC.md written as an AI-consumable prompt/instruction set

**Source of truth:** https://booking-bmo-financial-solutions.vercel.app (deployed single version)
**Consumer:** Claude Code Opus 4.6 in a separate Rails project
**Scope:** Single booking form only (no admin, no dual/eureka version)

## Requirements

### Validated

<!-- Shipped and confirmed valuable in v1.0 -->

- ✓ Current hour slot remains visible until the hour ends — v1.0
- ✓ Users can quickly book the current hour with one click (Book Now) — v1.0
- ✓ Book Now only appears when current hour is available — v1.0
- ✓ Book Now reuses existing booking panel workflow — v1.0
- ✓ Deployed to 4 admin instances — v1.0

### Active

<!-- Current scope: v2.0 Spec Package -->

- [ ] Visual capture of every booking form state from deployed version
- [ ] Clean reference code extracted and annotated
- [ ] Blueprint-level UI/UX specification
- [ ] Architecture and data flow specification
- [ ] Functional specification with all edge cases
- [ ] Master SPEC.md as AI-consumable entry point

### Out of Scope

<!-- Explicit boundaries. -->

- Admin app spec — Separate milestone later
- Dual/eureka version — Different architecture, not needed
- Rails implementation — That's the OTHER project's job
- Mobile-specific specs — Web-first, current form is desktop-focused
- Deployment/hosting specs — Rails project has its own infrastructure

## Context

**This repo:** React 18 + Vite 6 + Vercel Serverless + Vercel KV
**Deployed at:** https://booking-bmo-financial-solutions.vercel.app
**GitHub:** boydclinton82/cps-calendar-book-form (Vercel auto-deploy)

**Why this milestone exists:**
A separate Rails project needs to recreate this exact booking form. The repo is messy with old/new code mixed together. The spec package provides a clean, unambiguous blueprint that the Rails project's Claude Code can follow without getting lost in repo archaeology.

**Key insight:** The spec must be technology-neutral in its behavior descriptions but include React reference code for implementation context. The Rails Claude adapts patterns to its own stack.

## Constraints

- **Blueprint level**: Leave nothing to interpretation — exhaustive detail
- **AI-optimized**: Written for Claude Code consumption, not human developers
- **Single version only**: No dual-column/eureka patterns
- **Technology-neutral behavior**: Describe WHAT and WHY, not React-specific HOW
- **Reference code included**: Clean code for context, clearly labeled as "adapt, don't port"

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Store times in QLD timezone | Queensland has no DST, simpler storage | ✓ Good |
| Display-only timezone toggle | Avoids storage complexity, users convert mentally today | ✓ Good |
| Blueprint spec depth | AI consumer won't be overwhelmed; "perfectly" requires exhaustive detail | — Pending |
| Live + code approach | Screenshots capture visual truth; code reveals logic screenshots can't | — Pending |
| Technology-neutral behavior specs | Rails is fundamentally different from React; behavior transfers, patterns don't | — Pending |

---
*Last updated: 2026-02-13 after milestone v2.0 start*
