# Phase 10: Master Spec Assembly - Research

**Researched:** 2026-02-13
**Domain:** Specification package assembly for AI code generation
**Confidence:** HIGH

## Summary

Phase 10 assembles the culmination of 9 prior documentation phases into a single AI-consumable specification package. This research investigated best practices for creating specification packages that AI coding agents (specifically Claude Code Opus 4.6) can consume to recreate complex software systems.

The 2026 landscape has converged on **Spec-Driven Development (SDD)** as the emerging standard for AI-assisted software engineering. The core principle: specifications are treated as the source of truth, and code becomes a generated or verified secondary artifact. This inverts the traditional development workflow.

**Primary recommendation:** Create a layered specification package with a SPEC.md entry point that provides clear navigation, build instructions, and context hierarchy. Follow Addy Osmani's six core areas (commands, testing, structure, style, git workflow, boundaries) and use the three-tier boundary system (✅ Always do / ⚠️ Ask first / 🚫 Never do) to guide AI behavior.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Markdown | N/A | Documentation format | Lightweight, structured, human and machine-readable; LLM-friendly format; "text format of the future" for AI |
| Git | N/A | Version control for specs | Spec-driven workflows treat specs as executable artifacts that evolve with the project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AGENTS.md | N/A | AI agent instructions file | Optional: Small markdown file at repo root telling AI tools how project works; growing standard |
| CLAUDE.md | N/A | Claude-specific instructions | Optional: Project conventions, coding style, lint rules for Claude Code |
| GitHub Spec Kit | N/A | Spec-driven workflow toolkit | Optional: Template system for specify/plan/tasks workflow |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single SPEC.md entry point | Multiple scattered README files | Single entry point provides clear navigation; scattered docs cause context overload |
| Markdown files | JSON/YAML structured specs | Markdown is human-readable and LLM-friendly; structured formats are harder for humans to scan |
| Modular spec sections | Monolithic single-file spec | Modular avoids context overload; monolithic is simpler for small projects |

**Installation:**

No installation required - this is a documentation architecture, not a software package.

## Architecture Patterns

### Recommended Project Structure

Based on research into Spec Kit, Kiro, Tessl, and contemporary SDD practices:

```
.planning/
├── SPEC.md                          # Entry point (AI reads this first)
├── PROJECT.md                       # High-level project context
├── STATE.md                         # Current position and decisions
├── phases/
│   ├── 05-visual-capture/
│   │   ├── SCREENSHOT-MANIFEST.md   # Index of visual truth
│   │   └── screenshots/             # Categorized screenshots
│   ├── 06-code-extraction/
│   │   ├── FILE-MANIFEST.md         # Index of code reference
│   │   ├── ANNOTATIONS.md           # Technology translation guide
│   │   └── extracted-code/          # Clean reference implementation
│   ├── 07-ui-ux-documentation/
│   │   ├── LAYOUT-STRUCTURE.md
│   │   ├── DESIGN-TOKENS.md
│   │   ├── COMPONENT-STATES.md
│   │   ├── KEYBOARD-SHORTCUTS.md
│   │   ├── RESPONSIVE-BEHAVIOR.md
│   │   └── ANIMATIONS.md
│   ├── 08-architecture-documentation/
│   │   ├── DATA-STORAGE.md
│   │   ├── INSTANCE-CONFIG.md
│   │   ├── API-CONTRACTS.md
│   │   ├── POLLING-SYNC.md
│   │   └── STATE-MANAGEMENT.md
│   └── 09-functional-documentation/
│       ├── BOOKING-FLOW.md
│       ├── BOOK-NOW-FEATURE.md
│       ├── TIMEZONE-TOGGLE.md
│       ├── TIME-DATE-HANDLING.md
│       └── EDGE-CASES.md
```

### Pattern 1: Layered Context Delivery

**What:** Organize specifications in a hierarchy from high-level goals to detailed implementation.

**When to use:** When creating comprehensive specs for AI agents that need different levels of detail at different stages.

**Structure:**
1. **Entry point (SPEC.md)** - Navigation hub, build instructions, "how to use this spec"
2. **High-level context** - Project goals, constraints, architecture overview
3. **Domain-specific specs** - UI/UX, architecture, functional behavior
4. **Reference materials** - Screenshots, code samples, data examples

**Source:** [Addy Osmani: My LLM coding workflow going into 2026](https://addyosmani.com/blog/ai-coding-workflow/)

**Example:**
```markdown
# SPEC.md (Entry Point)

## How to Use This Spec

1. **Start here** - Read this file first for context and navigation
2. **Understand the goal** - Read PROJECT.md for high-level vision
3. **Review visual truth** - Study screenshots in phases/05-visual-capture/
4. **Understand behavior** - Read functional specs in phases/09-functional-documentation/
5. **Reference architecture** - Consult phases/08-architecture-documentation/ as needed
6. **Review UI details** - Use phases/07-ui-ux-documentation/ for styling
7. **Code reference** - See phases/06-code-extraction/ for React implementation patterns

## Build Instructions

[Detailed step-by-step implementation guidance...]
```

### Pattern 2: Technology-Neutral Behavior Specification

**What:** Describe system behavior in implementation-agnostic terms, separating WHAT from HOW.

**When to use:** When specification will be implemented in a different technology stack than the reference implementation.

**Principles:**
- Use abstract terminology: "system", "user", "application" instead of "React component", "Rails controller"
- Focus on business logic and data flow, not framework mechanics
- Document outcomes ("booking is created") not mechanisms ("setState triggers re-render")
- Provide reference code but mark it clearly as "adapt, don't port"

**Source:** Project's own ANNOTATIONS.md + [Understanding the agnostic approach in business software](https://www.future-of-software.com/blog/understanding-the-agnostic-approach-in-business-software)

**Example:**
```markdown
## Booking Creation Flow

**Trigger:** User selects available time slot
**Preconditions:**
- Slot must be available (not booked, not blocked, not past)
- User must select a person from configured user list
- Duration must be 1-8 hours and not exceed operating hours

**Steps:**
1. System validates slot availability
2. System validates duration doesn't create conflicts
3. System creates booking with optimistic update (local state changes immediately)
4. System sends booking to API in background
5. On success: Booking persists
6. On error: System rolls back local state and shows error

**Postconditions:**
- Booking exists in storage with structure: `{ user: string, duration: number }`
- Booked slot and subsequent blocked slots are visually marked
- User returns to navigation mode

**Reference implementation:** See `extracted-code/src/hooks/useBookings.js` lines 45-78
```

### Pattern 3: Modular Specification Sections

**What:** Break specifications into focused topic areas rather than monolithic documents.

**When to use:** Always, for complex systems. Prevents context overload and enables AI to consume only relevant sections.

**Organization:**
- **One concern per document** - UI specs separate from API specs separate from functional specs
- **Clear document IDs** - Use consistent naming (UIUX-01, ARCH-02, FUNC-03)
- **Cross-references** - Link related specs explicitly
- **Manifest files** - Provide indices (SCREENSHOT-MANIFEST.md, FILE-MANIFEST.md)

**Source:** [Spec-Driven Development: From Code to Contract](https://www.arxiv.org/abs/2602.00180) + [Zencoder: Practical Guide to SDD](https://docs.zencoder.ai/user-guides/tutorials/spec-driven-development-guide)

### Pattern 4: The Six Core Areas Framework

**What:** Structure specifications around six essential areas identified by Addy Osmani.

**When to use:** For comprehensive AI-consumable specs, especially when targeting Claude Code or similar coding agents.

**Six Core Areas:**

1. **Commands** - Full executable commands with all flags
   ```markdown
   ## Build Commands

   Development server:
   ```bash
   rails server -p 3000
   ```

   Run tests:
   ```bash
   bundle exec rspec --format documentation
   ```
   ```

2. **Testing** - Framework, locations, coverage expectations
   ```markdown
   ## Testing Strategy

   Framework: RSpec
   Test locations: spec/ directory mirroring app/ structure
   Coverage target: 90% for business logic (booking operations, validation)
   Run before: Every commit
   ```

3. **Project Structure** - Explicit directory organization
   ```markdown
   ## Directory Structure

   app/
   ├── models/         # Data models (Booking, Config)
   ├── controllers/    # API endpoints
   ├── services/       # Business logic (BookingService, ValidationService)
   └── jobs/           # Background tasks (SyncJob)
   ```

4. **Code Style** - Real code examples demonstrating conventions
   ```markdown
   ## Code Style

   Service objects:
   ```ruby
   class BookingService
     def initialize(booking_params)
       @booking_params = booking_params
     end

     def create
       # Validation first
       # Business logic second
       # Persistence last
     end
   end
   ```
   ```

5. **Git Workflow** - Branch naming, commit format, PR requirements
   ```markdown
   ## Git Workflow

   Branch naming: feature/SPEC-01-booking-creation
   Commit format: "feat(bookings): add create endpoint with validation"
   PR requirements: Tests pass, coverage maintained, spec reference in description
   ```

6. **Boundaries** - Three-tier permission system

**Source:** [Addy Osmani: How to write a good spec for AI agents](https://addyosmani.com/blog/good-spec/)

### Pattern 5: Three-Tier Boundary System

**What:** Explicit permission system for AI agent actions.

**When to use:** Always. Prevents AI from making dangerous or inappropriate changes.

**Three Tiers:**

```markdown
## Boundaries

### ✅ Always Do (No Approval Needed)
- Create new files in app/models/, app/controllers/, app/services/
- Add tests in spec/ directory
- Update documentation in this spec
- Add database migrations
- Refactor existing code while maintaining behavior

### ⚠️ Ask First (Requires Human Review)
- Change API contracts (breaking changes)
- Modify database schema for existing tables
- Change core business logic (validation rules, booking algorithms)
- Update dependencies (gems)
- Change configuration files

### 🚫 Never Do (Hard Stop)
- Commit secrets, API keys, credentials
- Delete or modify production data
- Skip tests
- Disable security features
- Force push to main branch
```

**Source:** [Addy Osmani: How to write a good spec for AI agents](https://addyosmani.com/blog/good-spec/)

### Anti-Patterns to Avoid

- **Vague specifications** - "Build something cool" or "Make it work well" provide no guidance
- **Static specifications** - Specs must evolve as implementation reveals gaps
- **Monolithic prompts** - Feeding entire spec at once causes context overload
- **Missing "how to use" guide** - AI needs explicit navigation instructions
- **Technology coupling** - React jargon in what should be behavior specs
- **Scattered entry points** - Multiple README files with unclear hierarchy

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Specification templates | Custom markdown structure | GitHub Spec Kit or established SDD patterns | Community-tested structures prevent common mistakes |
| Directory structure documentation | Manual tree drawings | Automated tools (tree command, readme-directory-tree) | Stays current automatically |
| Code-to-markdown aggregation | Custom scripts | AI Code Summary, Project To Markdown | Handles .gitignore, generates summaries, LLM-optimized |
| Spec navigation | Scattered links | Single SPEC.md entry point with clear sections | Prevents AI from getting lost in documentation |

**Key insight:** Spec-driven development in 2026 has established patterns. Don't invent new structures; follow the six core areas framework and modular organization.

## Common Pitfalls

### Pitfall 1: Treating Spec as Static Documentation

**What goes wrong:** Spec is written once, then implementation reveals gaps, edge cases, or unclear requirements, but spec is never updated. AI continues following outdated spec.

**Why it happens:** Traditional mindset treats requirements docs as throwaway artifacts after coding begins.

**How to avoid:**
- Commit SPEC.md to version control alongside code
- Update spec when implementation reveals missing detail
- Use spec as living artifact that evolves with project
- Include "last updated" dates in spec sections

**Warning signs:**
- Implementation deviates from spec without spec being updated
- Multiple interpretations of same requirement emerge
- AI generates code that contradicts earlier decisions

**Source:** [SDD and the Future of Software Development](https://www.cesarsotovalero.net/blog/sdd-and-the-future-of-software-development.html)

### Pitfall 2: Context Overload from Monolithic Specs

**What goes wrong:** Single massive spec file fed to AI causes:
- Token limit exceeded
- Important details buried in noise
- AI loses focus on current task
- Slower processing as irrelevant context is parsed

**Why it happens:** Assumption that "more context is always better" or desire for single-file simplicity.

**How to avoid:**
- Break specs into modular topic areas
- Feed only relevant sections per task
- Use SPEC.md as navigation hub, not comprehensive manual
- Create manifest/index files for collections (screenshots, code files)

**Warning signs:**
- AI responses become generic or miss specific requirements
- Processing takes unusually long
- AI asks for clarification on things already specified
- Errors referencing wrong context

**Source:** [Addy Osmani: My LLM coding workflow going into 2026](https://addyosmani.com/blog/ai-coding-workflow/)

### Pitfall 3: Technology Coupling in Behavior Specs

**What goes wrong:** Specs describe React useState, useEffect, component rendering instead of describing business behavior. Rails implementer can't translate because specs are React-specific.

**Why it happens:**
- Spec writer is deep in React mindset
- Confusion between "reference implementation" and "behavioral specification"
- Lack of abstraction layer in documentation

**How to avoid:**
- Use translation guide (like ANNOTATIONS.md)
- Separate reference code from behavior specs
- Use abstract terminology: "system", "application", "user" instead of framework terms
- Focus on WHAT and WHY, not HOW
- Mark code samples clearly: "Reference implementation - adapt, don't port"

**Warning signs:**
- Rails developer asks "How do I implement useEffect in Rails?"
- Specs mention component lifecycle instead of business lifecycle
- Behavior described as "re-renders when state changes" instead of "UI updates when data changes"

**Source:** Project's own ANNOTATIONS.md + research findings

### Pitfall 4: Missing "How to Use This Spec" Guide

**What goes wrong:** AI receives comprehensive spec but doesn't know:
- Which file to read first
- What order to consume documentation
- Which sections apply to current task
- How to navigate cross-references

Result: AI wanders through docs inefficiently or misses critical context.

**Why it happens:** Spec writer assumes structure is self-explanatory or AI will "figure it out".

**How to avoid:**
- Include explicit "How to Use This Spec" section in SPEC.md
- Provide numbered reading order (1. Start here, 2. Then read this, 3. Reference as needed)
- Explain document relationships (manifests index content, specs cross-reference architecture)
- Give task-specific navigation (for UI work: start with phase 07, reference phase 05)

**Warning signs:**
- AI asks "Where do I find X?" when X is documented
- Implementation misses requirements from unread sections
- AI re-asks questions answered in different document
- Inconsistent interpretation across implementation phases

**Source:** [How to Use a Spec-Driven Approach for Coding with AI](https://blog.jetbrains.com/junie/2025/10/how-to-use-a-spec-driven-approach-for-coding-with-ai/)

### Pitfall 5: Vague Boundaries and Constraints

**What goes wrong:** Spec says "be careful with X" or "don't break things" without explicit rules. AI either:
- Makes risky changes assuming they're allowed
- Asks for approval on safe changes, slowing workflow
- Interprets vague constraints inconsistently

**Why it happens:** Fear of being too prescriptive or assuming AI has "common sense".

**How to avoid:**
- Use three-tier boundary system (✅ Always / ⚠️ Ask / 🚫 Never)
- Be explicit about safe vs. dangerous operations
- List concrete examples in each tier
- Define what "breaking change" means for your project

**Warning signs:**
- AI makes dangerous changes without asking
- AI asks permission for obviously safe operations
- Inconsistent decision-making across similar situations
- Security issues from assumed permissions

**Source:** [Addy Osmani: How to write a good spec for AI agents](https://addyosmani.com/blog/good-spec/)

### Pitfall 6: Ignoring Visual Truth

**What goes wrong:** Spec describes UI in text ("cyan border on available slots") but screenshots show different colors. AI follows text description, produces incorrect visuals.

**Why it happens:**
- Screenshots captured before latest changes
- Text description is interpretation, not measurement
- No clear hierarchy: "screenshots are source of truth for visuals"

**How to avoid:**
- Establish clear hierarchy: screenshots trump text for visual details
- Include screenshot references in UI specs ("See 02-slot-states--001-slot-available.png")
- Extract exact values from code/screenshots, don't approximate
- Mark text descriptions as "approximate - see screenshot for truth"

**Warning signs:**
- Colors don't match deployed version
- Spacing/sizing differs from screenshots
- Layout doesn't match visual reference
- AI asks "which is correct, the spec or the screenshot?"

**Source:** Project-specific insight from Phase 5-7 work

## Code Examples

Verified patterns from research sources:

### Entry Point Structure (SPEC.md)

```markdown
# BMO Financial Booking System - Specification

**Version:** 2.0
**Last Updated:** 2026-02-13
**Target Consumer:** Claude Code Opus 4.6 (Rails implementation)
**Source Truth:** https://booking-bmo-financial-solutions.vercel.app

## Overview

Single booking calendar form for scheduling user time blocks. Users select available
time slots, assign to configured users, choose duration (1-8 hours), and manage bookings
through simple UI.

**Core Value:** Another Claude Code instance can perfectly recreate this booking form
from this spec alone.

## How to Use This Spec

### First Time Reading

1. **Start here** - You're in the right place
2. **PROJECT.md** - Understand goals and constraints
3. **Phase 05: Visual Capture** - Study screenshots to see what you're building
4. **Phase 09: Functional Documentation** - Learn system behavior
5. **Phase 08: Architecture Documentation** - Understand data flow
6. **Phase 07: UI/UX Documentation** - Get visual/interaction details
7. **Phase 06: Code Extraction** - Reference React patterns (adapt, don't port)

### During Implementation

**For API work:** Start with `phases/08-architecture-documentation/API-CONTRACTS.md`

**For UI work:** Start with `phases/07-ui-ux-documentation/`, reference screenshots
in `phases/05-visual-capture/screenshots/`

**For business logic:** Start with `phases/09-functional-documentation/BOOKING-FLOW.md`,
reference edge cases in `EDGE-CASES.md`

**For data modeling:** See `phases/08-architecture-documentation/DATA-STORAGE.md`
and `phases/06-code-extraction/FILE-MANIFEST.md`

### Document Hierarchy

**Source of truth for visuals:** Phase 05 screenshots (annotated versions)

**Source of truth for behavior:** Phase 09 functional specs

**Source of truth for data:** Phase 08 architecture specs + Phase 06 data structures

**Reference only:** Phase 06 React code (understand patterns, don't port syntax)

## Build Instructions

[Detailed implementation guidance organized by milestone...]

## Boundaries

### ✅ Always Do

- Create models, controllers, services, views
- Add tests for all business logic
- Update this spec when gaps found
- Use Rails conventions
- Commit working features

### ⚠️ Ask First

- Change API contracts (URL paths, request/response formats)
- Modify core business rules from functional specs
- Change data storage structure
- Add dependencies (gems)

### 🚫 Never Do

- Commit secrets or credentials
- Skip tests for booking operations
- Change technology-neutral behavior specs (behaviors must match React version)
- Implement features not in scope
- Force push to main

## Technology Stack

**Required:**
- Rails 7.x or later
- Ruby 3.x or later
- PostgreSQL or similar relational DB
- Redis or similar key-value store (for bookings)

**Optional:**
- Background job processor (Sidekiq recommended)
- API testing framework (RSpec recommended)

## Success Criteria

Implementation is complete when:

- [ ] All Phase 09 functional requirements implemented
- [ ] All Phase 08 API contracts satisfied
- [ ] Visual appearance matches Phase 05 screenshots
- [ ] All edge cases from EDGE-CASES.md handled
- [ ] Test coverage >90% for booking operations
- [ ] Deployed version behaves identically to reference app

## Questions During Implementation

If you encounter:

**Missing detail:** Update this spec with question + answer

**Unclear requirement:** Check functional specs first, screenshots second, code third

**Conflicting info:** Screenshots trump text for visuals, functional specs trump code for behavior

**Out of scope feature:** Ask human before implementing
```

**Source:** [Addy Osmani: How to write a good spec for AI agents](https://addyosmani.com/blog/good-spec/) + project requirements

### Technology-Neutral System Summary

```markdown
# System Summary

## What This System Does

Users book time slots for shared resources through a calendar interface. The system:

1. **Displays availability** - Shows 16 hourly slots (6 AM - 10 PM) per day
2. **Prevents conflicts** - Blocks overlapping bookings
3. **Supports multi-hour bookings** - Users book 1-8 consecutive hours
4. **Real-time sync** - Multiple users see updates via polling (7-second max latency)
5. **Simple interaction** - Click slot, pick person, choose duration, done

## Key Behaviors

### Booking Creation

User clicks available slot → panel slides in → user selects person → user selects
duration → system validates no conflicts → optimistic local update → background API call →
on success: booking persists, on error: rollback and retry

### Conflict Prevention

System checks: Is slot available? Does duration exceed operating hours? Would duration
overlap existing booking? Only proceeds if all checks pass.

### Multi-Hour Blocking

Booking at hour H with duration D creates:
- **Booked slot** at hour H (orange, shows user name)
- **Blocked slots** at hours H+1 through H+D-1 (orange, shows original booking info)
- Hour H+D remains available

Example: Booking at 7:00 AM for 3 hours blocks: 8:00 AM and 9:00 AM. 10:00 AM available.

### Time Handling

**Storage:** Queensland timezone (AEST, no DST), 24-hour format (HH:00)

**Display:** Toggle between QLD and NSW (+1 hour during NSW DST)

**Past slots:** Become unavailable when next hour begins (9:00 AM available until 10:00:00.000)

### Timezone Toggle

Visual-only offset, storage unchanged:
- QLD mode: Display hour = Storage hour
- NSW mode: Display hour = Storage hour + (isDST ? 1 : 0)

### Real-Time Sync

Every 7 seconds: Fetch all bookings → replace local state → UI updates

Optimistic updates: Local change immediate → API call background → on error: rollback

## Data Model

```
Bookings: {
  "2026-02-14": {
    "07:00": { user: "Jack", duration: 2 },
    "14:00": { user: "Bonnie", duration: 1 }
  }
}
```

Constraints:
- Date key: YYYY-MM-DD format
- Time key: HH:00 format (00-23)
- User: Must match configured user list
- Duration: 1-8 hours, cannot exceed operating hours or create conflicts

## User Experience Flows

**Quick booking (Book Now):**
Header button → auto-selects current hour → panel appears → pick person → pick duration → done

**Normal booking:**
Click slot → panel appears → pick person → pick duration → done

**Edit booking:**
Click existing booking → popup appears → change person or duration → auto-saves → close

**Delete booking:**
Click existing booking → popup appears → press Delete key → booking removed

## Interaction Modes

System operates in one of three modes:

1. **NAVIGATION** - Browse calendar, select slots/bookings
2. **PANEL** - Creating new booking (slot selected)
3. **POPUP** - Editing existing booking

Modes are mutually exclusive. Keyboard shortcuts context-aware (navigation disabled in POPUP).

## Edge Cases Handled

- Current hour booking at end of hour (available until next hour begins exactly)
- Multi-hour bookings that would exceed operating hours (rejected)
- Conflicting bookings from simultaneous users (server validates, loser rolled back)
- Week transitions (Saturday → Sunday wraps correctly)
- DST transitions (IANA timezone database determines isDST)
- Past hour refresh (UI updates at next hour boundary via scheduled timer)

See EDGE-CASES.md for complete enumeration (41 scenarios documented).

## Technology Constraints

**Must preserve:**
- Exact booking rules (validation, conflict detection, multi-hour blocking algorithm)
- User interaction flows (3 modes, keyboard shortcuts, optimistic updates)
- Visual states (available/booked/blocked/past slot styling)
- Time handling logic (QLD storage, optional NSW display offset)

**Can adapt:**
- Implementation language (React → Rails)
- Storage backend (Vercel KV → Redis/PostgreSQL)
- Polling mechanism (React interval → Rails ActionCable or polling)
- UI framework (React → Rails views/Hotwire)
```

**Source:** Synthesized from Phase 08-09 documentation + technology-neutral principles

### Directory Navigation Map

```markdown
# Specification Package Contents

## Entry Points

| File | Purpose | Read When |
|------|---------|-----------|
| **SPEC.md** | Master entry point, navigation hub, build instructions | First (you are here) |
| PROJECT.md | High-level goals, constraints, decisions | After SPEC.md |
| STATE.md | Current project position, accumulated decisions | Before continuing work |

## Phase Documentation

### Phase 05: Visual Capture

**Purpose:** Screenshot-based visual truth for UI/UX

| File | Contents |
|------|----------|
| SCREENSHOT-MANIFEST.md | Index of all 40 screenshots with descriptions |
| screenshots/01-initial-states/ | Initial load, empty calendar |
| screenshots/02-slot-states/ | Available, booked, blocked, past visual states |
| screenshots/03-booking-flow/ | Step-by-step booking creation sequence |
| screenshots/04-book-now-button/ | Quick booking feature |
| screenshots/05-timezone-toggle/ | QLD/NSW timezone toggle states |
| screenshots/06-responsive/ | Mobile, tablet, desktop layouts |
| screenshots/07-annotated/ | All screenshots with labels/callouts |

**Use for:** Visual design reference, color values, spacing, layout

### Phase 06: Code Extraction

**Purpose:** Clean React reference code with technology-neutral annotations

| File | Contents |
|------|----------|
| FILE-MANIFEST.md | Index of all extracted files with descriptions |
| ANNOTATIONS.md | Technology translation guide (React → any framework) |
| DEPENDENCIES.json | React package dependencies (reference only) |
| extracted-code/src/ | React source files with inline annotations |

**Use for:** Understanding implementation patterns, business logic reference

**WARNING:** This is React code. Adapt patterns, don't port syntax.

### Phase 07: UI/UX Documentation

**Purpose:** Complete visual and interaction specifications

| File | Contents |
|------|----------|
| LAYOUT-STRUCTURE.md | Spatial hierarchy, containment, positioning |
| DESIGN-TOKENS.md | Colors, typography, spacing, shadows (exact values) |
| COMPONENT-STATES.md | Interactive states (hover, active, disabled, focus) |
| KEYBOARD-SHORTCUTS.md | All keyboard interactions (context-aware modes) |
| RESPONSIVE-BEHAVIOR.md | Breakpoints, layout changes |
| ANIMATIONS.md | Transitions, motion, glass morphism effects |

**Use for:** UI implementation, styling, interaction design

### Phase 08: Architecture Documentation

**Purpose:** System architecture, data flow, API contracts

| File | Contents |
|------|----------|
| DATA-STORAGE.md | Storage structure, operations, constraints |
| INSTANCE-CONFIG.md | Configuration format, fallback behavior |
| API-CONTRACTS.md | All 5 endpoints with examples, error handling |
| POLLING-SYNC.md | Real-time sync mechanism, conflict resolution |
| STATE-MANAGEMENT.md | Data flow, state updates, optimistic updates |

**Use for:** Backend implementation, API design, data modeling

### Phase 09: Functional Documentation

**Purpose:** Complete behavior specifications, all business rules

| File | Contents |
|------|----------|
| BOOKING-FLOW.md | Create, edit, delete flows with decision tables |
| BOOK-NOW-FEATURE.md | Quick booking feature specification |
| TIMEZONE-TOGGLE.md | QLD/NSW toggle behavior |
| TIME-DATE-HANDLING.md | Time storage, display conversion, past slot detection |
| EDGE-CASES.md | 41 edge cases with expected behavior |

**Use for:** Business logic implementation, validation rules, edge case handling

## Cross-References

| When Working On... | Primary Docs | Supporting Docs |
|-------------------|--------------|-----------------|
| API endpoints | API-CONTRACTS.md | DATA-STORAGE.md, STATE-MANAGEMENT.md |
| Booking creation | BOOKING-FLOW.md | API-CONTRACTS.md, EDGE-CASES.md |
| UI layout | LAYOUT-STRUCTURE.md | Screenshots (07-annotated/), DESIGN-TOKENS.md |
| Visual styling | DESIGN-TOKENS.md | COMPONENT-STATES.md, Screenshots |
| Keyboard shortcuts | KEYBOARD-SHORTCUTS.md | BOOKING-FLOW.md (modes), COMPONENT-STATES.md |
| Time/date logic | TIME-DATE-HANDLING.md | TIMEZONE-TOGGLE.md, EDGE-CASES.md |
| Validation rules | BOOKING-FLOW.md | EDGE-CASES.md, DATA-STORAGE.md |
| Real-time sync | POLLING-SYNC.md | STATE-MANAGEMENT.md, API-CONTRACTS.md |
```

**Source:** Project structure + modular spec best practices

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Requirements as throwaway docs | Specs as living, version-controlled source of truth | 2025-2026 | Specs evolve with code, maintain accuracy |
| Monolithic specification files | Modular topic-based spec sections | 2025-2026 | Prevents AI context overload, enables focused consumption |
| Vague permission guidance | Three-tier boundary system (Always/Ask/Never) | 2026 | Clear AI agent permissions, fewer dangerous operations |
| "Consider these technologies" | Explicit stack with versions | 2025-2026 | AI doesn't waste time evaluating options |
| Implementation-first development | Spec-driven development | 2024-2026 | Specs guide AI generation, reduce rework |
| Scattered README files | Single SPEC.md entry point | 2025-2026 | Clear navigation prevents AI from getting lost |
| Generic documentation | AI-optimized markdown (six core areas) | 2025-2026 | Better AI consumption, more reliable generation |

**Deprecated/outdated:**

- **Waterfall specification documents** - Replaced by iterative, version-controlled specs that evolve with implementation
- **Code-first, document-later** - Replaced by spec-first AI workflows where specs drive generation
- **Human-only documentation** - Replaced by dual-purpose docs (human readable, AI consumable)
- **Unstructured permission systems** - Replaced by explicit three-tier boundaries

**Current state (February 2026):**

Spec-driven development has emerged as the dominant paradigm for AI-assisted software engineering. Tools like GitHub Spec Kit, workflows described by Addy Osmani, and frameworks from JetBrains/Zencoder represent convergence on core practices:

1. Specifications as executable artifacts (not throwaway requirements)
2. Modular organization (prevent context overload)
3. Six core areas framework (commands, testing, structure, style, git, boundaries)
4. Technology-neutral behavior specs (WHAT not HOW)
5. Layered context delivery (high-level → detailed)

## Open Questions

### 1. Optimal Spec Granularity for 200k Token Context Windows

**What we know:** Claude Code Opus 4.6 supports 200k token context windows. Current research recommends modular specs to prevent overload, but this guidance predates large context windows.

**What's unclear:** With 200k tokens available, should we:
- Still modularize aggressively?
- Feed entire spec package at once?
- Use hybrid approach (full context for planning, focused sections for implementation)?

**Recommendation:** Start modular (proven approach), test feeding larger context as experiment. Monitor for signs of context overload (generic responses, missed details, slow processing).

### 2. Screenshot Format for Optimal AI Consumption

**What we know:** Phase 05 captured PNG screenshots with annotations. Research confirms visual references are valuable.

**What's unclear:**
- Can Claude Code process images directly, or should we describe them in markdown?
- Are annotated screenshots better than clean screenshots + text descriptions?
- Should we extract color values to separate file for easier AI parsing?

**Recommendation:** Provide both (annotated screenshots + extracted values in DESIGN-TOKENS.md). Cross-reference screenshots from text specs. Let AI choose consumption method.

### 3. Verification Strategy for AI-Generated Rails Implementation

**What we know:** Success criteria defined (behavior matches React version), but verification method unclear.

**What's unclear:**
- Should we write automated tests comparing Rails vs React behavior?
- Manual QA against Phase 05 screenshots?
- Hybrid approach?

**Recommendation:** Define test suite in SPEC.md that Rails implementation must pass. Include both automated (API contract tests, booking flow tests) and manual (visual QA against screenshots) verification.

## Sources

### Primary (HIGH confidence)

- [Addy Osmani: How to write a good spec for AI agents](https://addyosmani.com/blog/good-spec/) - Six core areas framework, three-tier boundaries
- [Addy Osmani: My LLM coding workflow going into 2026](https://addyosmani.com/blog/ai-coding-workflow/) - Spec-first approach, layered context delivery
- [Spec-Driven Development: From Code to Contract in the Age of AI Coding Assistants (arXiv)](https://www.arxiv.org/abs/2602.00180) - SDD principles, three levels of rigor
- [Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) - File structures, modular approaches
- Project's own documentation (ANNOTATIONS.md, FILE-MANIFEST.md, functional specs) - Technology-neutral patterns

### Secondary (MEDIUM confidence)

- [Qodo: Top 7 Code Documentation Best Practices for Teams (2026)](https://www.qodo.ai/blog/code-documentation-best-practices-2026/) - Version control, AI review
- [How to Use a Spec-Driven Approach for Coding with AI (JetBrains)](https://blog.jetbrains.com/junie/2025/10/how-to-use-a-spec-driven-approach-for-coding-with-ai/) - Workflow phases
- [GitHub Spec Kit Guide](https://intuitionlabs.ai/articles/spec-driven-development-spec-kit) - Specification/planning/tasks structure
- [Zencoder: Practical Guide to SDD](https://docs.zencoder.ai/user-guides/tutorials/spec-driven-development-guide) - Implementation workflow
- [Boosting AI Performance: LLM-Friendly Content in Markdown (Webex)](https://developer.webex.com/blog/boosting-ai-performance-the-power-of-llm-friendly-content-in-markdown) - Markdown benefits for AI
- [AI Markdown Language](https://aimarkdown.org/docs) - Structured markdown for AI control
- [Understanding the agnostic approach in business software](https://www.future-of-software.com/blog/understanding-the-agnostic-approach-in-business-software) - Abstraction principles

### Tertiary (LOW confidence - WebSearch only)

- [Software Design Specification (SDS) Guide for Scalable Software 2026](https://www.anchorpoints.io/blogs/software-design-specification-sds-practical-guide-building-scalable-software-2026) - General SDS structure
- [GitBook: How to structure technical documentation](https://gitbook.com/docs/guides/docs-best-practices/documentation-structure-tips) - Information architecture
- [10 Essential Technical Documentation Best Practices for 2026](https://www.documind.chat/blog/technical-documentation-best-practices) - General doc practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Markdown and modular organization are established 2026 standards for AI specs
- Architecture patterns: HIGH - Six core areas and three-tier boundaries verified across multiple authoritative sources
- Technology-neutral specs: HIGH - Project has proven this approach across 9 phases
- Entry point structure: MEDIUM - Synthesized from multiple sources, not single authoritative template
- Pitfalls: HIGH - Derived from direct warnings in authoritative sources (Osmani, SDD papers)

**Research date:** 2026-02-13
**Valid until:** 30 days (spec-driven development is stabilizing, but tools/practices still evolving rapidly in early 2026)
