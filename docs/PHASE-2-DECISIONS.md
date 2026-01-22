# Phase 2: Architectural Decisions Log

This document tracks significant architectural decisions made during Phase 2 implementation.

---

## Decision 1: Position-Based Color System

**Date**: 2025-01-22
**Context**: The existing system uses name-based color classes (`.user-jack`, `.user-bonnie`). This couples colors to specific user names.

**Decision**: Migrate to position-based classes (`.user-1`, `.user-2`, ..., `.user-6`)

**Rationale**:
- Supports any user names without CSS changes
- Colors assigned by position in config array, not by name
- Up to 6 users supported (matches existing color palette)
- Users maintain consistent colors based on their position

**Implementation**:
- CSS variables: `--user-1-color`, `--user-1-rgb`, etc.
- CSS classes: `.user-1`, `.user-2`, etc.
- Utility function: `getUserColorClass(userName, users)` returns position-based class

---

## Decision 2: Mock Config Before API

**Date**: 2025-01-22
**Context**: Need to decouple config from hardcoded values before API exists.

**Decision**: Implement ConfigContext with hardcoded mock data first, then swap to API fetch.

**Rationale**:
- Allows frontend refactoring without backend dependency
- Each milestone is independently testable
- Provides fallback if API unavailable

---

## Decision 3: Polling-Based Sync

**Date**: 2025-01-22
**Context**: Need real-time sync across browsers/devices.

**Decision**: Use 7-second polling interval instead of WebSockets.

**Rationale**:
- Simpler to implement with Vercel serverless architecture
- Suitable for calendar use case (second-level updates not needed)
- Lower infrastructure complexity
- Can upgrade to WebSockets later if needed

---

## Decision 4: Deferred Admin App

**Date**: 2025-01-22
**Context**: Admin wizard for instance management is specified in Phase 2.

**Decision**: Defer admin app to Phase 2.5, manually seed KV data initially.

**Rationale**:
- Core multi-instance functionality is the priority
- Manual KV seeding is sufficient for initial deployment
- Reduces Phase 2 scope and risk
- Admin app can be built independently later

---

## Pending Decisions

*(Add items here as questions arise during implementation)*
