# CPS Calendar Book Form

## What This Is

A multi-instance booking calendar template deployed via Vercel. Each instance allows users to book time slots for shared resources (typically meeting rooms). The admin app creates new instances from this template repo, and all 5 current deployments stay in sync. A complete AI-optimized specification package exists for recreating the booking form in Rails.

## Core Value

Users can quickly see availability and book time slots without conflicts.

## Requirements

### Validated

- ✓ Current hour slot remains visible until the hour ends — v1.0
- ✓ Users can quickly book the current hour with one click (Book Now) — v1.0
- ✓ Book Now only appears when current hour is available — v1.0
- ✓ Book Now reuses existing booking panel workflow — v1.0
- ✓ Deployed to 4 admin instances — v1.0
- ✓ Visual capture of every booking form state from deployed version — v2.0
- ✓ Clean reference code extracted and annotated — v2.0
- ✓ Blueprint-level UI/UX specification — v2.0
- ✓ Architecture and data flow specification — v2.0
- ✓ Functional specification with all edge cases — v2.0
- ✓ Master SPEC.md as AI-consumable entry point — v2.0

### Active

(None — next milestone not yet defined)

### Out of Scope

- Admin app spec — Separate milestone later
- Dual/eureka version — Different architecture, not needed
- Rails implementation — That's the OTHER project's job
- Mobile-specific specs — Web-first, current form is desktop-focused
- Deployment/hosting specs — Rails project has its own infrastructure

## Context

**This repo:** React 18 + Vite 6 + Vercel Serverless + Vercel KV
**Deployed at:** https://booking-bmo-financial-solutions.vercel.app
**GitHub:** boydclinton82/cps-calendar-book-form (Vercel auto-deploy)

**v2.0 shipped:** Complete specification package (21 key documents, 40 screenshots, 39 extracted code files, ~34,373 lines of documentation) ready for Rails Claude consumption. Entry point: `.planning/phases/10-master-spec-assembly/SPEC.md`

**v1.0 shipped:** Time slot fix, Book Now quick booking, timezone toggle with DST detection, deployed to 4 admin instances.

## Constraints

- **Blueprint level**: Leave nothing to interpretation — exhaustive detail
- **AI-optimized**: Written for Claude Code consumption, not human developers
- **Single version only**: No dual-column/eureka patterns
- **Technology-neutral behavior**: Describe WHAT and WHY, not React-specific HOW
- **Reference code included**: Clean code for context, clearly labeled as "adapt, don't port"

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Store times in QLD timezone | Queensland has no DST, simpler storage | ✓ Good |
| Display-only timezone toggle | Avoids storage complexity, users convert mentally today | ✓ Good |
| Blueprint spec depth | AI consumer requires exhaustive detail for "perfect" recreation | ✓ Good |
| Live + code approach | Screenshots capture visual truth; code reveals logic screenshots can't | ✓ Good |
| Technology-neutral behavior specs | Rails is fundamentally different from React; behavior transfers, patterns don't | ✓ Good |
| Hybrid documentation approach | Workflow narratives + decision tables + state machines + Given-When-Then scenarios | ✓ Good |
| Layered context delivery | SPEC.md -> SYSTEM-SUMMARY.md -> Phase-specific specs prevents context overload | ✓ Good |
| Milestone-based build instructions | 8 dependency-ordered milestones (data -> API -> logic -> UI) | ✓ Good |
| Three-tier boundary system | Always Do / Ask First / Never Do for Rails Claude autonomy | ✓ Good |

---
*Last updated: 2026-02-13 after v2.0 milestone*
