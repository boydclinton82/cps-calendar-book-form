---
phase: 07-ui-ux-documentation
plan: 02
subsystem: ui-specification
tags: [component-states, animations, transitions, keyframes, glass-morphism, interaction-design]

requires:
  - phase: 05-visual-capture
    what: Screenshot manifest with visual state references
    why: Component states documented from captured screenshots showing hover, selected, booked states
  - phase: 06-code-extraction
    what: Extracted CSS files with state classes and keyframe definitions
    why: All state selectors and animation code extracted from TimeSlot.css, Header.css, BookingPanel.css, etc.
  - phase: 07-01
    what: Layout structure and design tokens
    why: Component states reference layout regions and design token names

provides:
  - artifact: COMPONENT-STATES.md
    what: Complete state matrix for every interactive element (11 components, 47+ states)
    for: Rails developer to understand ALL visual states (default, hover, focus, active, disabled, keyboard-focused, etc.)
  - artifact: ANIMATIONS.md
    what: All CSS animations and transitions with timing, easing, keyframes (7 animations, 10+ transitions, 6 glass effects)
    for: Rails developer to recreate exact motion design and glass morphism

affects:
  - phase: 07-03-onwards
    what: Remaining UI/UX docs (keyboard shortcuts, responsive behavior)
    how: Keyboard docs reference keyboard-focused state; responsive docs reference mobile state adaptations
  - phase: 08-behavior-specification
    what: Interaction flow documentation
    how: Behavior flows describe WHEN state changes occur (click → selected state + panel opens)

tech-stack:
  added: []
  patterns:
    - name: State matrix documentation
      what: Tables documenting every possible state with trigger, visual properties, CSS source
      where: COMPONENT-STATES.md
      example: Time slots have 7 states; booking blocks have 3 states × 6 user colors
    - name: Keyframe animation specifications
      what: Complete animation documentation with duration, easing, keyframes, purpose
      where: ANIMATIONS.md
      example: pulse-glow (2s infinite), glowPulse (0.6s once), slideIn (0.3s staggered)
    - name: Glass morphism recipe
      what: backdrop-filter blur with semi-transparent backgrounds for frosted-glass effect
      where: 4 blur levels (4px-20px) across 6 components
      rationale: Creates depth and visual hierarchy while maintaining readability

key-files:
  created:
    - path: .planning/phases/07-ui-ux-documentation/COMPONENT-STATES.md
      loc: 414
      purpose: Complete state matrix for all 11 interactive components
    - path: .planning/phases/07-ui-ux-documentation/ANIMATIONS.md
      loc: 605
      purpose: All animations, transitions, and glass morphism effects
  modified: []

decisions:
  - what: Document keyboard-focused state from CSS only (not captured in screenshots)
    why: Phase 5 screenshots captured mouse interactions; keyboard focus state exists in CSS but wasn't photographed
    alternatives: Skip undocumented states, request new screenshots
    impact: Rails dev has complete state coverage including keyboard navigation (gold border distinguishes from cyan mouse focus)
  - what: Include both hex and RGB values for user colors in booking blocks
    why: Booking blocks use rgba(var(--user-N-rgb), 0.35) pattern requiring RGB triplets
    alternatives: Document only hex, Rails dev converts
    impact: Complete color specifications ready for direct implementation
  - what: Document glass morphism as separate section in ANIMATIONS.md
    why: Backdrop-filter blur is critical visual effect but not technically an "animation"
    alternatives: Include in DESIGN-TOKENS.md or LAYOUT-STRUCTURE.md
    impact: Developers understand glass effect as motion-adjacent (blur affects perception of depth/layering)

metrics:
  duration: 6 minutes
  completed: 2026-02-13
  tasks: 2
  commits: 2
  loc_added: 1019
  files_created: 2
  verification_checks: 12
---

# Phase 07 Plan 02: Component States & Animations Summary

**Documented 11 interactive components across 47+ states (available, hover, selected, disabled, keyboard-focused) and 7 CSS keyframe animations with complete timing, easing, and glass morphism specifications.**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-02-12T22:19:57Z
- **Completed:** 2026-02-12T22:25:51Z
- **Tasks:** 2
- **Files created:** 2
- **Total LOC:** 1019 lines

## Accomplishments

1. **COMPONENT-STATES.md (414 lines)**: Complete state documentation for 11 components
   - Time slots: 7 states (available, hover, selected, occupied, past, keyboard-focused, just-booked)
   - Header buttons: Book Now, Week/Timezone toggles, Navigation (3 states each)
   - Panel/Popup buttons: Options, Cancel, Done, Delete, Close (2-4 states each)
   - Booking blocks: 3 states × 6 user colors = 18 color variations
   - Week view: Column headers and slots (3-6 states)
   - 64 CSS source references
   - 32 screenshot references

2. **ANIMATIONS.md (605 lines)**: Complete animation and motion design specification
   - 7 @keyframes animations: pulse-glow (2s), glowPulse (0.6s), keyboardFocusPulse (1.5s), fadeIn (0.15s), popupSlideIn (0.2s), slideIn (0.3s), slideInDay (0.4s)
   - 10+ transition behaviors: panel slide, button transforms, opacity fades, color changes
   - 6 glass morphism effects: 4 blur levels (4px-20px) across TimeStrip, BookingPanel, BookingPopup, WeekView, hints bar, popup overlay
   - 54 CSS source references
   - Timing philosophy and motion patterns for Rails implementation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create COMPONENT-STATES.md** - `b5b4080` (docs)
2. **Task 2: Create ANIMATIONS.md** - `354e676` (docs)

## Files Created

```
.planning/phases/07-ui-ux-documentation/
├── COMPONENT-STATES.md (414 lines)
│   └── State matrices for 11 components with 47+ total states
└── ANIMATIONS.md (605 lines)
    └── 7 keyframe animations + 10+ transitions + 6 glass effects

Total: 2 files, 1019 lines
```

## Decisions Made

### 1. Document Keyboard-Focused State from CSS Only

**Context:** Phase 5 screenshots captured mouse interactions (hover, click, selected), but keyboard navigation states weren't photographed.

**Decision:** Document keyboard-focused state from CSS source (TimeSlot.css:105-130) even though no screenshot exists.

**Rationale:**
- Keyboard focus state is fully defined in CSS (gold border #fbbf24, pulsing animation)
- Intentionally uses gold instead of cyan to visually distinguish keyboard from mouse interaction
- Rails developer needs complete state coverage for accessibility
- CSS source is authoritative for this state

**Alternative Considered:** Skip undocumented states, mark as "implementation-defined"
**Why Not:** Incomplete state coverage would result in guesswork during Rails implementation

**Impact:** Rails developer has exhaustive state documentation including keyboard navigation. Documented as "Not captured (CSS-only)" with full CSS source reference.

---

### 2. Include Both Hex and RGB Values for User Colors

**Context:** Booking blocks use position-based user colors (6 users, 6 colors) with pattern: `background: rgba(var(--user-N-rgb), 0.35)`.

**Decision:** Document both hex (#4ADE80) and RGB (74, 222, 128) for all 6 user colors in state tables.

**Rationale:**
- RGB triplets required for rgba() transparency pattern
- Hex values more readable for solid colors and cross-referencing
- Rails developer shouldn't have to convert between formats
- Pattern repeats 6 times (user-1 through user-6), consistency matters

**Alternative Considered:** Only document hex, Rails dev converts to RGB when needed
**Why Not:** Adds friction and potential for conversion errors

**Impact:** Complete color specifications in both formats. State tables show exact values Rails needs: "rgba(var(--user-1-rgb), 0.35)" pattern clearly documented.

---

### 3. Document Glass Morphism in ANIMATIONS.md

**Context:** Glass morphism (backdrop-filter blur with semi-transparent backgrounds) is a major visual effect but not technically an animation.

**Decision:** Document glass effects as separate section in ANIMATIONS.md instead of DESIGN-TOKENS.md or LAYOUT-STRUCTURE.md.

**Rationale:**
- Backdrop-filter affects motion perception (creates depth/layering illusion)
- Blur is motion-adjacent: affects how users perceive element entrance/exit
- Animation doc already covers timing and transitions (glass is context-adjacent)
- 6 components use glass effect with 4 different blur intensities

**Alternative Considered:** Add glass specs to DESIGN-TOKENS.md as "Visual Effects" section
**Why Not:** Design tokens doc is for static values; glass effect is about perception and depth

**Impact:** Developers understand glass as part of motion design system. Complete recipe provided: semi-transparent bg + backdrop-filter blur + webkit prefix + subtle border + layered shadows.

---

## Deviations from Plan

**None.** Plan executed exactly as written.

Both documents created with all required sections:
- Component states doc: 11 components, 47+ states, state matrices with triggers/visual properties/sources
- Animations doc: 7 keyframes, 10+ transitions, 6 glass effects, timing philosophy

All verification criteria passed:
- COMPONENT-STATES.md: 414 lines (≥200), 64 CSS sources (≥30), 32 screenshot refs (≥8), disabled/keyboard states documented
- ANIMATIONS.md: 605 lines (≥100), 8 @keyframes (≥6), 10 duration specs (≥7), 54 sources (≥15), easing and backdrop-filter documented

---

## Component State Coverage

### Time Slots (Most Complex: 7 States)

| State | CSS Class | Key Properties | Source |
|-------|-----------|----------------|--------|
| Available | `.available` | Cyan border, glow, pointer cursor | TimeSlot.css:19-27 |
| Available:hover | `.available:hover` | Brighter bg, stronger glow, translateY(-1px) | TimeSlot.css:29-37 |
| Selected | `.selected` | Intense cyan glow, 2px border, layered shadows | TimeSlot.css:40-49 |
| Occupied | `.occupied` | Transparent (overlay shows booking block) | TimeSlot.css:52-57 |
| Past | `.past` | Opacity 0.35, not-allowed cursor, muted bg | TimeSlot.css:60-65 |
| Keyboard-focused | `.keyboard-focused` | Gold border #fbbf24, pulsing animation | TimeSlot.css:105-130 |
| Just-booked | `.just-booked` | Confirmation pulse 0.6s | TimeSlot.css:100-102 |

### Header Buttons (3 States Each)

**Book Now:**
- Visible (default): Cyan bg, pulsing glow animation
- Visible:hover: Brighter cyan, scale(1.05), animation paused
- Hidden: Not rendered when unavailable

**Week/Timezone Toggles:**
- Default (inactive): Transparent bg, cyan border/text
- Default:hover: Cyan tinted bg, stronger glow
- Active: Cyan bg, dark text

**Navigation (prev/next day/week):**
- Default: Cyan bg, 48x48px, glow shadow
- Hover: Brighter, scale(1.08)
- Active (pressed): scale(0.98) press-down

### Panel & Popup Buttons

**Option Buttons (user/duration selection):**
- Default: Dark bg, transparent border
- Hover: Cyan tinted bg, glow border, translateX(4px) indent
- Selected: Cyan bg, dark text, glow shadow
- Disabled: Opacity 0.35, not-allowed cursor

**Cancel Button:**
- Default: Transparent, subtle border, secondary text
- Hover: Red-tinted bg, red border/text (#f87171)

**Popup Buttons (Done/Delete/Close):**
- Done: Cyan bg → hover: scale(1.02), stronger glow
- Delete: Red-tinted bg → hover: stronger red + glow
- Close: Transparent → hover: cyan tint

### Booking Blocks (18 Variations)

**Pattern (repeats for 6 users):**
- Default: User color bg at 35% opacity, user border at 60%, user glow
- Hover: Lower bg opacity (18%), stronger border (80%), translateY(-1px), cancel hint fades in
- Focus: User-colored outline, 2px solid at 60% opacity

**User Colors:**
1. Green (#4ADE80)
2. Magenta (#E879F9)
3. Gold (#FCD34D)
4. Purple (#A78BFA)
5. Coral (#FB923C)
6. Rose (#FDA4AF)

### Week View (6 States)

**Column Headers:**
- Default: Dark bg, transparent border
- Hover: Cyan tinted bg, glow border
- Today: Cyan bg, dark text, glow shadow

**Week Slots:**
- Available: Dark subtle bg, faint cyan border
- Available:hover: Cyan border + bg + glow
- Occupied: Transparent (overlay shows block)
- Past: Muted bg, 0.4 opacity

---

## Animation Specifications

### Keyframe Animations

| Animation | Duration | Easing | Loop | Trigger | Properties | Source |
|-----------|----------|--------|------|---------|------------|--------|
| **pulse-glow** | 2s | ease-in-out | infinite | Book Now visible | box-shadow (glow intensity) | Header.css:57-64 |
| **glowPulse** | 0.6s | ease-out | once | Booking created | box-shadow (confirmation pulse) | TimeSlot.css:91-102 |
| **keyboardFocusPulse** | 1.5s | ease-in-out | infinite | Keyboard focus | box-shadow (gold glow) | TimeSlot.css:119-130 |
| **fadeIn** | 0.15s | ease-out | once | Popup opens | opacity (0 → 1) | BookingPopup.css:41-48 |
| **popupSlideIn** | 0.2s | ease-out | once | Popup opens | opacity + transform (slide from above) | BookingPopup.css:50-59 |
| **slideIn** | 0.3s | ease-out | once | Panel opens | opacity + transform (slide from right) | BookingPanel.css:168-177 |
| **slideInDay** | 0.4s | ease-out | once | Week view loads | opacity + transform (slide from right) | WeekView.css:53-62 |

### Transition Behaviors

**Global Tokens:**
- `--transition-fast`: 150ms ease-out (button hovers, state changes, text colors, borders, opacity)
- `--transition-medium`: 300ms ease-out (panel slide, content appearance)

**Key Transitions:**
- Panel slide: transform translateX(100% → 0) in 300ms
- Button scales: scale(1.02-1.08) in 150ms on hover
- Slot/block lift: translateY(-1px) in 150ms on hover
- Option indent: translateX(4px) in 150ms on hover
- Cancel hint fade: opacity (0 → 1) in 150ms on hover

### Glass Morphism (Backdrop Filter)

| Blur Level | Value | Components | Source |
|------------|-------|------------|--------|
| Subtle | blur(4px) | Popup overlay backdrop | BookingPopup.css:8 |
| Medium | blur(12px) | Header hints bar | Header.css:205 |
| Strong | blur(16px) | Week grid | WeekView.css:14 |
| Very Strong | blur(20px) | BookingPanel, BookingPopup | BookingPanel.css:10, BookingPopup.css:25 |

**Recipe:** Semi-transparent bg (60% opacity) + backdrop-filter blur + webkit prefix + subtle cyan border + layered shadows (glow + depth)

---

## Cross-References

### From Previous Phases

**Phase 5 (Visual Capture):**
- Screenshot manifest used for 32 visual state references
- Key screenshots: 01-initial-states/, 02-slot-states/, 03-booking-flow/, 04-book-now-button/, 05-timezone-toggle/

**Phase 6 (Code Extraction):**
- 64 CSS source references across TimeSlot.css, Header.css, BookingPanel.css, BookingPopup.css, BookingBlock.css, WeekView.css
- All state selectors (.available, .selected, .occupied, etc.) extracted from component CSS

**Phase 07-01 (Layout & Tokens):**
- Design token references: --accent, --bg-primary, --bg-tertiary, --text-primary, --user-N-color, --transition-fast, --transition-medium
- Layout region references: Header buttons, TimeStrip slots, BookingPanel sections, BookingPopup actions

### For Next Phases

**Phase 07-03 (Keyboard Shortcuts):**
- Keyboard-focused state documented (gold border #fbbf24)
- Kbd element styling from Header.css (hints bar)

**Phase 07-04 (Responsive Behavior):**
- Mobile state adaptations noted (week toggle hidden, panel full-width, smaller buttons)

**Phase 08 (Behavior Specification):**
- State transition triggers documented (click → selected, booking → just-booked)
- Animation timing defines UX flow pacing (panel takes 300ms to slide in)

---

## Technical Discoveries

### 1. Keyboard Focus Gold vs Mouse Focus Cyan

**Found:** Time slots use #fbbf24 (gold/amber) for keyboard focus instead of #00E5E5 (cyan) used for mouse selection.

**Purpose:** Visual distinction between keyboard navigation and mouse interaction.

**Implementation:**
- `.selected` (mouse click): Cyan border, cyan glow
- `.keyboard-focused` (tab key): Gold border, gold glow, pulsing animation

**Impact:** Rails must preserve this distinction for accessibility. Different colors ensure keyboard-only users can see where focus is.

**Source:** TimeSlot.css:105-117

---

### 2. Booking Block Hover Opacity Inversion

**Found:** Booking blocks LOWER background opacity on hover (0.35 → 0.18) instead of increasing it.

**Purpose:** Makes underlying time slot more visible on hover, reveals "cancel" affordance.

**Mechanism:**
- Default: Higher opacity background obscures slot
- Hover: Lower opacity background reveals slot beneath + cancel hint fades in (opacity 0 → 1)

**Visual Effect:** Block becomes "see-through" on hover, suggesting it can be removed.

**Impact:** Rails must use exact opacity values; pattern is intentional UX signal.

**Source:** BookingBlock.css:19, 33, 240-242

---

### 3. Staggered Animation Delays Create Cascades

**Found:** Panel sections and week columns use staggered animation delays for sequential entrance.

**Panel Sections:**
- Fixed delays via :nth-child selectors
- Section 2: 50ms delay
- Section 3: 100ms delay
- Creates 100ms total cascade

**Week Columns:**
- Dynamic delays via inline CSS variable `--delay`
- Each column: 0ms, 50ms, 100ms, 150ms, 200ms, 250ms, 300ms
- Creates 300ms total cascade (7 columns)

**Effect:** Content "flows" into view left-to-right or top-to-bottom instead of "popping" in simultaneously.

**Impact:** Rails can use :nth-child approach for panel, needs to inject inline styles for week columns.

**Source:** BookingPanel.css:160-165, WeekView.css:50

---

### 4. Animation Pause on Hover (Book Now Button)

**Found:** pulse-glow animation (2s infinite) pauses when user hovers over Book Now button.

**Implementation:**
- Default: `animation: pulse-glow 2s ease-in-out infinite`
- Hover: `animation: none` (pauses animation)

**Purpose:** Animation draws attention to button, but stops when user engages to avoid distraction during interaction.

**Impact:** Rails must apply `animation: none` on hover state to replicate behavior.

**Source:** Header.css:54, 70

---

## Quality Metrics

**COMPONENT-STATES.md Coverage:**
- ✅ 11 distinct components documented
- ✅ 47+ total states (7 for time slots alone)
- ✅ 64 CSS source references (TimeSlot.css, Header.css, BookingPanel.css, BookingPopup.css, BookingBlock.css, WeekView.css)
- ✅ 32 screenshot references from Phase 5 (or "Not captured" notes for CSS-only states)
- ✅ Every state has: trigger, visual properties, CSS source, screenshot reference
- ✅ 414 lines (>= 200 required)

**ANIMATIONS.md Coverage:**
- ✅ 7 @keyframes animations fully specified
- ✅ 10+ transition behaviors documented
- ✅ 6 glass morphism effects (4 blur levels across components)
- ✅ 54 CSS source references
- ✅ Complete keyframe definitions (0%/50%/100% values)
- ✅ Timing philosophy and motion patterns section
- ✅ 605 lines (>= 100 required)

**Technology-Neutral Language:**
- ✅ No React hooks, components, or patterns mentioned
- ✅ States described by visual properties (background, border, box-shadow, transform, opacity, cursor)
- ✅ Animations described by CSS properties and timing functions
- ✅ Rails developer can implement from description without learning React

**Traceability:**
- ✅ Every state traceable to CSS source file and line numbers
- ✅ Every animation traceable to keyframe definition or transition property
- ✅ Every color/token referenced from DESIGN-TOKENS.md
- ✅ Every component located in LAYOUT-STRUCTURE.md

---

## Next Phase Readiness

### Immediate Next Step: Phase 07-03+ (Remaining UI/UX Docs)

**What's Ready:**
- Component state vocabulary established (available, selected, occupied, keyboard-focused, etc.)
- Animation timing specifications documented (--transition-fast, --transition-medium, stagger patterns)
- Glass effect specifications complete (4 blur levels, semi-transparent backgrounds)
- All interactive elements cataloged with hover/focus/active states

**What's Needed for 07-03+:**
- Keyboard shortcuts documentation (reference keyboard-focused state from COMPONENT-STATES.md)
- Responsive behavior documentation (reference mobile state adaptations noted in component states)

**For Phase 08 (Behavior Specification):**
- State transitions define WHEN changes occur (user clicks → selected state)
- Animation durations define HOW FAST changes occur (panel slides in over 300ms)
- Behavior docs will describe WHAT user actions trigger WHICH state/animation sequences

### Readiness Checklist

**For Keyboard Shortcuts (07-03):**
- ✅ Keyboard-focused state documented (gold border distinguishes from mouse cyan)
- ✅ Kbd element styling documented (Header.css hints bar)
- ✅ State change triggers documented (tab key → keyboard-focused)

**For Responsive Behavior (07-04):**
- ✅ Mobile adaptations noted in component states (week toggle hidden, panel full-width)
- ✅ Breakpoint-specific changes documented where applicable

**For Behavior Specification (08):**
- ✅ All state transitions documented (click → selected, booking → just-booked)
- ✅ Animation triggers documented (panel opens → slideIn cascade, popup opens → fadeIn + popupSlideIn)
- ✅ Interactive element states provide vocabulary for behavior flows

### Blockers/Concerns

**None identified.** All prerequisites for remaining Phase 7 plans and Phase 8 are satisfied.

Component states and animations provide complete visual specification. Rails developer now knows:
- **WHAT** every element looks like in every state (COMPONENT-STATES.md)
- **HOW** elements transition between states (ANIMATIONS.md)
- **WHEN** state changes occur (triggers documented in state matrices)

---

**Phase 07 Plan 02: COMPLETE**

Next: Continue Phase 7 with remaining UI/UX documentation (keyboard shortcuts, responsive behavior).
