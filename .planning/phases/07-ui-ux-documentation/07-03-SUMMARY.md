---
phase: 07-ui-ux-documentation
plan: 03
subsystem: ui-interaction-systems
tags: [keyboard-shortcuts, responsive-design, interaction-modes, mobile-ux, accessibility]
requires:
  - 06-03 # Annotated code with keyboard logic extraction
  - 05-02 # Responsive screenshots for visual reference
provides:
  - "Complete keyboard shortcut specification with 3 interaction modes"
  - "Responsive behavior documentation for 3 breakpoints (600px/768px/desktop)"
  - "Dynamic user hotkey system specification"
  - "Touch target sizing compliance reference"
affects:
  - 08-behavior-specs # Will reference keyboard modes and responsive behaviors
  - 09-data-specs # May inform mobile-specific data handling requirements
dependency-graph:
  requires: ["06-03", "05-02"]
  provides: ["keyboard-interaction-spec", "responsive-layout-spec"]
  affects: ["08-01", "08-02", "09-01"]
tech-stack:
  added: []
  patterns:
    - "Context-aware keyboard modes (navigation/panel/popup)"
    - "Dynamic configuration-driven hotkeys"
    - "Responsive breakpoints with mobile-first overlays"
    - "Touch target accessibility compliance"
key-files:
  created:
    - ".planning/phases/07-ui-ux-documentation/KEYBOARD-SHORTCUTS.md"
    - ".planning/phases/07-ui-ux-documentation/RESPONSIVE-BEHAVIOR.md"
  modified: []
decisions:
  - id: "context-aware-keyboard-modes"
    choice: "Three mutually exclusive keyboard modes with priority hierarchy"
    rationale: "Prevents shortcut conflicts and makes keyboard navigation predictable"
  - id: "dynamic-user-hotkeys"
    choice: "User hotkeys read from config, not hardcoded in UI"
    rationale: "Different deployments can customize hotkeys per their user roster"
  - id: "mobile-full-screen-overlays"
    choice: "Panel and popup become 100% width on ≤768px with backdrop"
    rationale: "Touch interfaces benefit from maximum target sizes and focus"
  - id: "hidden-keyboard-ui-mobile"
    choice: "Hide keyboard hints bar and week toggle on ≤600px"
    rationale: "Touch users don't use keyboard shortcuts; space better used for content"
metrics:
  duration: "4 minutes"
  completed: "2026-02-13"
---

# Phase 07 Plan 03: Keyboard Shortcuts + Responsive Behavior Summary

**One-liner:** Context-aware keyboard shortcuts with 3 interaction modes, plus responsive breakpoints with mobile full-screen overlays and touch target compliance.

---

## Objective

Document all keyboard shortcuts with their conditional behavior rules (3 interaction modes: navigation/panel/popup), and all responsive breakpoints with per-component layout adaptations (mobile 600px, tablet 768px, desktop).

**Purpose:** Keyboard shortcuts tell the Rails developer WHAT keys do WHAT and WHEN. Responsive behavior tells them HOW the layout adapts at each breakpoint. Together they complete the UI/UX specification for interaction systems (UIUX-05) and responsive design (UIUX-06).

---

## What Was Delivered

### 1. KEYBOARD-SHORTCUTS.md (283 lines)

**Comprehensive keyboard shortcut specification with:**

- **3 Interaction Modes:**
  - **Navigation Mode** (default): B/W/T, arrows, Enter — calendar navigation and view switching
  - **Panel Mode** (creating booking): User keys, 1/2/3 (duration), Escape — booking creation workflow
  - **Popup Mode** (editing booking): D (delete), user keys, duration keys, Enter/Escape — booking modification

- **Mode Priority Diagram:** Clear hierarchy showing popup > panel > navigation

- **Complete Shortcut Tables:**
  - Navigation: 8 shortcuts (B, W, T, Left/Right, Up/Down, Enter)
  - Panel: 5 shortcuts (user keys, 1/2/3, Escape)
  - Popup: 6 shortcuts (D, Enter, Escape, user keys, 1/2/3)

- **Dynamic User Hotkeys:**
  - Not hardcoded — loaded from instance configuration
  - Config structure: `{ users: [{ name: "Jack", key: "j" }] }`
  - Keyboard handler iterates config to match keypresses
  - Different deployments can have different user keys

- **Global Validation Rules:**
  - Shortcuts ignored when focus in INPUT/TEXTAREA
  - Shortcuts ignored when keyboard system disabled

- **Keyboard Hints Bar Specification:**
  - Glass morphism styling with cyan left-edge glow
  - Located below navigation, above time grid
  - Hidden on mobile (max-width: 600px)
  - Displays configured shortcuts dynamically

- **Keyboard Focus Visual System:**
  - Gold/amber border (#fbbf24) with pulsing animation
  - Distinct from selected state (cyan)
  - Tab/arrow navigation moves focus between slots
  - Enter activates focused slot

**Technology-neutral:** Describes WHAT keys do WHAT, not React implementation details.

**Source extraction:**
- useKeyboard.js (all 215 lines): Complete keyboard logic
- Header.css:196-263: Keyboard hints bar styling
- TimeSlot.css:105-130: Keyboard focus visual system

---

### 2. RESPONSIVE-BEHAVIOR.md (361 lines)

**Complete responsive behavior specification with:**

- **3 Breakpoint Definitions:**
  - Mobile: max-width 600px (small phones)
  - Tablet: max-width 768px (tablets, large phones)
  - Desktop: 769px+ (laptops, monitors)

- **Per-Component Responsive Changes (7 components):**

  | Component | Changes | Key Adaptation |
  |-----------|---------|----------------|
  | **Header** | Stacked layout, hidden hints/week toggle | Vertical stacking on mobile |
  | **TimeStrip** | Fixed 360px → fluid 100% | Full-width slots on mobile |
  | **BookingBlock** | Smaller padding, text size | Proportional text scaling |
  | **BookingPanel** | 340px sidebar → 100% full-screen | Overlay mode on ≤768px |
  | **BookingPopup** | 340px centered → 100% with gutters | Edge-gutter modal on ≤768px |
  | **WeekView** | Narrower time column, smaller text | Compact grid on ≤768px |
  | **TimeSlot** | No changes | Consistent 36px height (touch-friendly) |

- **Mobile-Specific Behaviors:**
  - Full-screen booking panel with dark backdrop overlay
  - Body scroll lock (modal-open class)
  - Hidden keyboard hints bar and week toggle
  - Touch target compliance (36px minimum)

- **Viewport Screenshot Comparisons:**
  - Desktop 1440px: Full header, centered grid, side panel
  - Tablet 768px: Compact text, full-screen panel begins
  - Mobile 375px: Stacked header, fluid grid, full-screen overlays
  - Mobile + Panel: Full-screen with backdrop
  - All screenshots from Phase 5 (06-responsive/)

- **What Does NOT Change:**
  - Color palette, font families, animation timings
  - Slot states, booking flow, keyboard shortcuts
  - Visual hierarchy and interaction model

- **4 Responsive Design Patterns:**
  1. Fluid width with fixed max (TimeStrip)
  2. Sidebar to full-screen overlay (BookingPanel)
  3. Centered modal to edge-gutter modal (BookingPopup)
  4. Proportional text scaling (WeekView, BookingBlock)

**Technology-neutral:** Exact CSS values with media query syntax, but describes behavior independent of Rails implementation approach.

**Source extraction:**
- Header.css:251-273: Mobile header adaptations
- TimeStrip.css:26-33: Fluid width logic
- BookingPanel.css:147-152: Full-screen overlay
- BookingPopup.css:244-249: Edge-gutter modal
- WeekView.css:174-204: Week view tablet/mobile sizing
- BookingBlock.css:244-256: Mobile text sizing
- SCREENSHOT-MANIFEST.md: Responsive screenshot references

---

## Decisions Made

### 1. Context-Aware Keyboard Modes

**Decision:** Implement keyboard shortcuts as three mutually exclusive modes with priority hierarchy (popup > panel > navigation).

**Rationale:**
- Prevents shortcut conflicts (e.g., 'B' for "Book Now" vs user "Bonnie")
- Makes keyboard behavior predictable (user always knows which shortcuts are active)
- Modal UX pattern matches visual hierarchy (popup on top → gets keyboard priority)

**Impact:**
- Rails must track open/closed state of panel and popup globally
- Keyboard handler routes to mode-specific logic first
- UI should indicate active mode (e.g., panel open = panel shortcuts visible)

**Alternatives considered:** Global shortcuts always active → rejected due to conflicts

---

### 2. Dynamic User Hotkeys from Config

**Decision:** User keyboard shortcuts are read from instance configuration, not hardcoded in code or CSS.

**Rationale:**
- Different deployments have different user rosters (Jack/Teagan vs Alice/Bob)
- Keyboard shortcuts should reflect actual users, not placeholder names
- Config-driven approach makes system adaptable without code changes

**Impact:**
- Rails must load user config and pass to keyboard handler
- UI must render user keys dynamically (not hardcoded "J" labels)
- Documentation must explain config structure for deployments

**Alternatives considered:** Hardcoded J/T/C keys → rejected as inflexible

---

### 3. Mobile Full-Screen Overlays

**Decision:** BookingPanel and BookingPopup become 100% width on ≤768px with dark backdrop dimming the calendar.

**Rationale:**
- Touch interfaces need maximum target sizes (fat finger problem)
- Full-screen eliminates accidental taps outside modal area
- Backdrop provides visual focus (calendar dimmed, panel/popup emphasized)
- Standard mobile UX pattern (matches native app behavior)

**Impact:**
- Rails must implement backdrop overlay element
- Body scroll lock required (prevent scrolling behind modal)
- Tap backdrop to close must work

**Alternatives considered:** Keep 340px width on mobile → rejected as too cramped for touch

---

### 4. Hidden Keyboard UI on Mobile

**Decision:** Hide keyboard hints bar and week toggle button on viewports ≤600px.

**Rationale:**
- Touch users don't use keyboard shortcuts (no hints needed)
- Mobile screen space is precious (hints bar uses ~60px vertical space)
- Week toggle can be hidden as power users access week view on desktop

**Impact:**
- Keyboard shortcuts still work if external keyboard connected (just no visual hints)
- Week view still accessible via API/state, just no button on mobile UI

**Note:** Shortcuts remain functional, only the visual UI is hidden.

**Alternatives considered:** Keep all UI visible → rejected due to space constraints

---

## Key Technical Insights

### Keyboard Mode Blocking

**Insight:** Higher-priority modes BLOCK lower-priority shortcuts completely.

**Example:**
- User presses 'B' while panel is open
- System checks: popup open? No. Panel open? Yes.
- Route to panel mode handler
- Panel mode: 'B' matches user "Bonnie" → select Bonnie
- Navigation mode 'B' (Book Now) never evaluated

**Why it matters:** Prevents unexpected behavior. User expects panel shortcuts only while panel is open.

---

### Responsive Breakpoint Strategy

**Insight:** Different components use different breakpoints intentionally.

**Breakdown:**
- **600px:** Header, TimeStrip, BookingBlock (content-focused components)
- **768px:** BookingPanel, BookingPopup, WeekView (interaction-focused components)

**Why:** Panel/popup need full-screen treatment earlier (tablet size) for touch usability. Grid components can stay desktop-like longer.

---

### Touch Target Compliance

**Insight:** All interactive elements meet 36px minimum touch target (WCAG 2.1 Level AA).

**Evidence:**
- Time slots: 36px height (no change needed)
- Week headers: 50px → 52px on mobile (increase for touch)
- Nav buttons: 48px × 48px (adequate)
- User/duration buttons: 14px padding + content → naturally > 36px

**Rails implication:** Must verify button/link sizes during implementation.

---

## Verification Results

**KEYBOARD-SHORTCUTS.md:**
- ✅ Line count: 283 (exceeds 100 minimum)
- ✅ Mode coverage: 3 modes documented (navigation, panel, popup)
- ✅ Condition documentation: "Condition" column in all shortcut tables
- ✅ Config documentation: 10 references to "config" or "dynamic"
- ✅ Source references: 23 references to useKeyboard.js

**RESPONSIVE-BEHAVIOR.md:**
- ✅ Line count: 361 (exceeds 80 minimum)
- ✅ Breakpoint coverage: Both 600px and 768px documented (11 media query references)
- ✅ Component changes: 7 components with per-breakpoint tables
- ✅ Screenshot references: 6 references to 06-responsive/
- ✅ Hidden elements: 5 references to "display: none" or "Hidden"
- ✅ Full-screen behavior: 15 references to "full-screen" or "100%"

**Technology-neutrality verified:** Both documents describe WHAT/WHEN/HOW without React-specific implementation details.

---

## Deviations from Plan

None — plan executed exactly as written.

All tasks completed as specified:
- Task 1: Created KEYBOARD-SHORTCUTS.md with 3 modes, complete shortcut tables, dynamic user hotkeys
- Task 2: Created RESPONSIVE-BEHAVIOR.md with 3 breakpoints, per-component changes, mobile behaviors

No bugs discovered, no missing functionality encountered, no architectural questions raised.

---

## Next Phase Readiness

**Phase 07 Plan 04** (Component Interaction Patterns) can proceed immediately.

**What's now available:**
- Complete keyboard shortcut specification with mode-aware behavior
- Complete responsive behavior specification with exact CSS values
- Touch target sizing reference
- Mobile-specific overlay and backdrop patterns

**What Plan 04 needs:**
- Document how TimeSlot, BookingBlock, BookingPanel, BookingPopup interact
- Document state flow between components
- Document event propagation and data flow

**Blockers:** None

**Concerns:** None

---

## Integration Points

### For Rails Implementation

**Keyboard shortcuts:**
1. Load user config to populate dynamic hotkeys
2. Implement mode tracking (panel/popup open state)
3. Add global keydown listener with mode routing
4. Render keyboard hints bar with dynamic user keys
5. Style keyboard focus indicator (gold border)

**Responsive behavior:**
1. Choose CSS approach (plain CSS, Tailwind, CSS modules)
2. Implement 600px and 768px breakpoints with documented changes
3. Add backdrop overlay for mobile panel/popup
4. Implement body scroll lock for modals
5. Hide keyboard UI elements on mobile

**Files to reference:**
- KEYBOARD-SHORTCUTS.md: Complete behavior specification
- RESPONSIVE-BEHAVIOR.md: Complete layout specification
- useKeyboard.js: Reference implementation logic
- Component CSS files: Exact styling values

---

## Quality Metrics

**Documentation completeness:**
- 644 total lines of specification (283 + 361)
- 19 keyboard shortcuts documented with full details
- 7 components with responsive behavior documented
- 3 breakpoints with exact CSS media queries
- 4 responsive design patterns described

**Source coverage:**
- 8 CSS files extracted for responsive behavior
- 1 JavaScript file (215 lines) extracted for keyboard logic
- 4 responsive screenshots referenced
- All media queries cataloged with line numbers

**Technology-neutrality:**
- Zero React-specific terminology (hooks, components, props)
- Behavior described as "when X happens, Y occurs"
- CSS values provided as exact pixel/rem measurements
- Rails developer can implement without React knowledge

---

## Commits

| Commit | Task | Files | Description |
|--------|------|-------|-------------|
| 738ef57 | Task 1 | KEYBOARD-SHORTCUTS.md | Complete keyboard shortcut system with 3 modes, dynamic hotkeys, focus system |
| a81c381 | Task 2 | RESPONSIVE-BEHAVIOR.md | Complete responsive behavior system with 3 breakpoints, mobile overlays, touch targets |

---

**Phase:** 07 of 10
**Plan:** 03 of 06 in current phase
**Status:** ✅ Complete
**Duration:** 4 minutes
**Next:** Plan 04 (Component Interaction Patterns)
