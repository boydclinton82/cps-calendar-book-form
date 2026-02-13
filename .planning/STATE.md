# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Another Claude Code instance can perfectly recreate the single booking form from this spec alone
**Current focus:** Phase 8 complete — ready for Phase 9 (Functional Documentation)

## Current Position

Phase: 9 of 10 (Functional Documentation)
Plan: 2 of 5 in current phase
Status: In progress
Last activity: 2026-02-13 — Completed 09-02-PLAN.md (Book Now, Timezone Toggle)

Progress: [████████░░] 82% (8 phases complete, 2 plans in phase 9)

## Accumulated Context

### Decisions

| Decision | Rationale | Phase | Impact |
|----------|-----------|-------|--------|
| Blueprint spec depth | AI consumer requires exhaustive detail for "perfect" recreation | 05-roadmap | All spec phases |
| Live + code approach | Screenshots capture visual truth; code reveals logic screenshots can't | 05-roadmap | Phase 05-07 |
| Technology-neutral behavior specs | Rails differs from React; behavior transfers, patterns don't | 05-roadmap | Phase 06-08 |
| Single version only | No dual/eureka patterns in spec | 05-roadmap | All spec phases |
| Playwright for automation | Better selector stability and modern browser API vs Puppeteer | 05-01 | Screenshot capture |
| Three breakpoints (375/768/1440) | Cover mobile, tablet, desktop for responsive behavior | 05-01 | Screenshot coverage |
| Category-based screenshot organization | Map screenshots directly to VCAP requirements for traceability | 05-01 | Phase 05-07 |
| Hardcoded annotation positions | Manual positioning ensures accuracy vs auto-detection for AI consumer | 05-02 | Annotation script |
| Red text on dark backgrounds | High contrast for dark theme app readability | 05-02 | Screenshot annotations |
| Remove unused exports | Clean reference better than "just in case" preservation | 06-01 | Code extraction |
| CSS as visual reference | Color/spacing patterns transfer, syntax doesn't | 06-01 | Rails implementation |
| Exclude /versions/ code | Only current working code relevant for spec | 06-01 | Code extraction |
| Explicit data structures | AI consumer needs clear schema, implicit shapes are error-prone | 06-02 | Rails implementation |
| API contracts with examples | Stable interface between React and Rails requires explicit documentation | 06-02 | Rails implementation |
| Storage as abstract interface | Document what (operations), not how (implementation) for portability | 06-02 | Rails implementation |
| Standardized annotation tags | Consistent tagging makes code scannable and enables systematic Rails translation | 06-03 | Rails implementation |
| Inline annotations vs separate docs | Keeps context close to code; annotations live with the logic they explain | 06-03 | Code documentation |
| Technology Translation Guide | React→Rails mapping helps Rails developer understand React patterns without learning React | 06-03 | Rails implementation |
| Layout docs before component states | Component state docs need to reference WHERE components exist (layout regions) and WHAT visual values they use (design tokens) | 07-01 | All remaining UI/UX docs |
| Exhaustive token extraction | Rails needs ALL visual values (not just CSS custom properties) including hardcoded colors from component CSS | 07-01 | Rails implementation |
| Include both hex and RGB | CSS rgba() needs RGB triplet, but hex is more readable for solid colors; Rails shouldn't convert | 07-01 | Rails implementation |
| Document keyboard-focused state from CSS only | Phase 5 screenshots captured mouse interactions; keyboard focus state exists in CSS but wasn't photographed | 07-02 | Rails has complete state coverage including keyboard navigation |
| Include both hex and RGB for user colors | Booking blocks use rgba(var(--user-N-rgb), 0.35) pattern requiring RGB triplets | 07-02 | Complete color specifications ready for direct implementation |
| Document glass morphism in ANIMATIONS.md | Backdrop-filter blur is critical visual effect but not technically an "animation" | 07-02 | Developers understand glass effect as motion-adjacent |
| Context-aware keyboard modes | Three mutually exclusive modes prevent shortcut conflicts and make behavior predictable | 07-03 | Rails implementation |
| Dynamic user hotkeys from config | Configuration-driven hotkeys allow different deployments to customize per their user roster | 07-03 | Rails implementation |
| Namespace isolation via slug-based key prefixes | Multiple teams can share same KV database with complete data separation | 08-01 | Each instance reads/writes to `instance:{slug}:*` keys only |
| Read-modify-write pattern for all updates | Full object replacement on every write operation | 08-01 | Simplifies KV usage, acceptable for low-concurrency booking system |
| Graceful fallback configuration | Hardcoded fallback config when API unavailable | 08-01 | Application must never crash due to missing configuration |
| Polling over WebSockets | Simple implementation for low-concurrency booking app | 08-03 | Maximum 7-second latency acceptable, no WebSocket connection management |
| Complete state replacement (no diffing) | Polling replaces entire bookings object on every tick | 08-03 | Simpler than tracking individual changes, catches all creates/updates/deletes |
| Optimistic updates for all operations | Makes UI feel instant, errors self-correct via triggerSync | 08-03 | Most operations succeed, rollback on conflict keeps state consistent |
| Strict state initialization order | Config loads before bookings, bookings load before polling starts | 08-03 | Dependencies must be satisfied for validation and sync to work correctly |
| Hybrid documentation approach for functional specs | Workflow narratives + decision tables + state machines + Given-When-Then scenarios | 09-01 | AI and developers can scan tables faster than parsing conditional prose |
| Three mutually exclusive interaction modes | NAVIGATION, PANEL, POPUP modes cannot overlap | 09-01 | Prevents UI state conflicts, enables keyboard trap pattern |
| Decision tables for all conditional logic | 154 table rows document slot click, duration validation, mode transitions, conflicts | 09-01 | Tables reveal gaps prose hides, scannable by AI and humans |
| Separate conflict logic for create vs extend | canBook() checks all slots, canChangeDuration() checks only new slots | 09-01 | User extending booking shouldn't be blocked by their own occupied slots |
| Book Now uses internal QLD time | NSW users with timezone toggle see offset display, but Book Now books current QLD hour | 09-02 | "Book now" means current business hour, not current display hour |
| Book Now visibility hidden (not disabled) | Button completely hidden when unavailable, not shown in disabled state | 09-02 | Clearer UX than disabled button with tooltip |
| DST detection must use IANA timezone names | All DST detection uses Intl API with Australia/Sydney timezone name | 09-02 | DST rules change by legislation; IANA database maintained by platform |
| Timezone preference stored client-side only | Preference in browser localStorage, no server-side storage | 09-02 | Single-instance app, browser-based preference sufficient |
| Simple offset addition for display conversion | displayHour = storageHour + (isDST ? 1 : 0) instead of full timezone conversion | 09-02 | Known +0/+1 offset, simple arithmetic clearer than conversion library |

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-13
Stopped at: Completed 09-02-PLAN.md (Book Now, Timezone Toggle)
Resume file: None

---
*State initialized: 2026-02-13 for v2.0 milestone*
