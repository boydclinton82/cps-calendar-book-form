---
phase: 07-ui-ux-documentation
plan: 01
subsystem: ui-specification
tags: [layout, design-tokens, css, visual-design, typography, spacing, color-system]

requires:
  - phase: 05-visual-capture
    what: Screenshot manifest with 40 visual truth references
    why: Layout regions and visual states documented from screenshots
  - phase: 06-code-extraction
    what: Extracted CSS files with all design values
    why: Design tokens extracted from index.css and component CSS

provides:
  - artifact: LAYOUT-STRUCTURE.md
    what: Complete spatial hierarchy with positioning and containment
    for: Rails developer to understand WHERE everything goes
  - artifact: DESIGN-TOKENS.md
    what: Exhaustive design token reference (colors, typography, spacing, timing)
    for: Rails developer to know WHAT visual values to use

affects:
  - phase: 07-02-onwards
    what: All remaining UI/UX docs reference layout structure and design tokens
    how: Component states reference layout regions; animations reference timing tokens
  - phase: 08-behavior-specification
    what: Interaction flows reference layout regions (panel slides in, popup appears)
    how: Behavior docs describe WHAT happens to WHICH layout components

tech-stack:
  added: []
  patterns:
    - name: Glass morphism
      what: Translucent backgrounds with backdrop-filter blur
      where: Panels, popups, hints bar, calendar containers
      files: [index.css, TimeStrip.css, BookingPanel.css, BookingPopup.css, WeekView.css, Header.css]
    - name: Z-index layering
      what: Fixed positioning with explicit z-index values (100, 200, 201)
      where: BookingPanel, popup-overlay, booking-popup
      rationale: Ensures correct stacking order for overlays
    - name: Position-based user colors
      what: 6 user colors assigned by list position (not name)
      where: User booking blocks, option buttons
      rationale: Consistent color assignment regardless of user name changes
    - name: Absolute overlay system
      what: BookingOverlay with pointer-events:none, blocks with auto
      where: Booking blocks overlay time slots
      rationale: Blocks appear to replace slots while maintaining slot layout

key-files:
  created:
    - path: .planning/phases/07-ui-ux-documentation/LAYOUT-STRUCTURE.md
      loc: 538
      purpose: Spatial hierarchy and component containment documentation
    - path: .planning/phases/07-ui-ux-documentation/DESIGN-TOKENS.md
      loc: 711
      purpose: Complete visual design token reference
  modified: []

decisions:
  - what: Document layout regions before component states
    why: Component state docs need to reference WHERE components exist (regions) and WHAT visual values they use (tokens)
    alternatives: Could document states first, but would lack spatial and visual context
    impact: Establishes vocabulary for all remaining UI/UX docs
  - what: Extract ALL design tokens (not just CSS custom properties)
    why: Rails needs hardcoded values too (keyboard focus gold, delete button red, popup backdrop)
    alternatives: Only document :root variables, reference CSS for rest
    impact: 711-line comprehensive token doc vs smaller focused doc
  - what: Include both hex and RGB for all colors
    why: CSS rgba() needs RGB triplet, but hex is more readable for solid colors
    alternatives: Only hex (Rails dev does conversion), only RGB (less readable)
    impact: Larger tables but Rails dev has both formats ready
  - what: Technology-neutral language (describe WHAT, not React HOW)
    why: Rails implementation differs from React; behavior transfers, patterns don't
    alternatives: Include React component names and patterns
    impact: Docs are pure visual/spatial spec, no framework coupling

metrics:
  duration: 6 minutes
  completed: 2026-02-13
  tasks: 2
  commits: 2
  loc_added: 1249
  files_created: 2
  verification_checks: 10
---

# Phase 07 Plan 01: Layout Structure & Design Tokens Summary

**One-liner:** Documented complete spatial hierarchy (5 layout regions, component tree, overlay system, z-index layers) and extracted all 30+ design tokens (colors, typography, spacing, timing, shadows) with CSS source references.

## What Was Built

### Deliverables

1. **LAYOUT-STRUCTURE.md (538 lines)**
   - Component hierarchy tree (App → Header → TimeStrip/WeekView → BookingPanel → BookingPopup)
   - 5 distinct layout regions (header, day grid, week grid, side panel, centered popup)
   - Day view vs week view layouts (360px centered vs full-width 8-column grid)
   - Overlay system (absolute BookingBlocks over relative slots-container)
   - Glass morphism effects (backdrop-filter blur with translucent backgrounds)
   - Z-index layering (100 for panel, 200 for overlay, 201 for popup)
   - Responsive breakpoints (600px mobile, 768px tablet)
   - 11 screenshot references, 11 CSS source references

2. **DESIGN-TOKENS.md (711 lines)**
   - **Color System:** 30+ tokens (backgrounds, accents, slots, 6 user colors, text, borders, glass)
   - **Typography:** 2 font families, 15 font sizes, 4 weights, letter-spacing, text-shadow patterns
   - **Spacing:** Complete scale (2px-32px) for padding/margin/gap
   - **Timing:** 2 transition tokens + 7 animation durations with keyframe definitions
   - **Border Radius:** 8 distinct values (2px scrollbar to 16px containers)
   - **Box Shadows:** Glow patterns (cyan accent), glass shadows (depth + highlight), user block shadows
   - **Backdrop Filters:** 4 blur levels (4px overlay to 20px strong glass)
   - **Special Patterns:** Inset highlights, transforms, opacity values, pointer-events strategy
   - 24 CSS source references

### Key Patterns Established

**Glass Morphism Recipe:**
```css
background: rgba(15, 29, 50, 0.6);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(0, 229, 229, 0.2);
box-shadow: 0 0 40px rgba(0, 229, 229, 0.08), 0 8px 32px rgba(0, 0, 0, 0.5);
```
**Applied to:** TimeStrip, BookingPanel, BookingPopup, WeekView, header-hints

**Z-Index Layering:**
- TimeSlot/week-slot: 0 (default, background layer)
- BookingBlock: 2 (overlays slots)
- BookingPanel: 100 (slides over calendar)
- popup-overlay: 200 (dims everything)
- booking-popup: 201 (modal on top)

**Position-Based User Colors:**
- 6 user colors (green, magenta, gold, purple, coral, rose)
- Assigned by array position, not user name
- Each has `-color` (hex) and `-rgb` (triplet) tokens for solid and transparent use

**Overlay System:**
- slots-container: `position: relative` (establishes context)
- BookingOverlay: `position: absolute`, `pointer-events: none` (click-through)
- BookingBlock: `position: absolute`, `pointer-events: auto` (clickable)
- Occupied slots: transparent background, hidden time label, blocks show instead

## Decisions Made

### 1. Layout Documentation Before Component States

**Context:** Phase 7 has 6 plans (layout, tokens, component states, animations, keyboard, responsive). Need to determine order.

**Decision:** Document layout structure (spatial hierarchy) and design tokens (visual values) FIRST.

**Rationale:**
- Component state docs need to reference WHERE components exist (layout regions)
- Component state docs need to reference WHAT colors/sizes they use (design tokens)
- These two docs establish the vocabulary for all remaining UI/UX documentation

**Alternative Considered:** Document component states first, then extract layout/tokens from those examples.
**Why Not:** Would result in repeated explanations of layout and scattered token values.

**Impact:** LAYOUT-STRUCTURE.md and DESIGN-TOKENS.md become the foundation referenced by all subsequent UI/UX docs.

---

### 2. Exhaustive Token Extraction (Not Just :root Variables)

**Context:** index.css has 30+ CSS custom properties in :root, but component CSS files have additional hardcoded values (keyboard focus gold, delete button red).

**Decision:** Extract ALL design tokens, including hardcoded values from component CSS.

**Rationale:**
- Rails developer needs every visual value to recreate the interface
- Hardcoded colors are deliberate design choices (gold for keyboard focus to distinguish from cyan mouse focus)
- "Just reference the CSS" doesn't work for Rails (different file structure)

**Alternative Considered:** Only document :root CSS custom properties, tell Rails dev to read component CSS for rest.
**Why Not:** Fragments token reference across multiple docs, requires Rails dev to hunt through CSS files.

**Impact:** 711-line comprehensive DESIGN-TOKENS.md vs ~200-line focused :root-only doc. More complete but larger.

---

### 3. Include Both Hex and RGB for All Colors

**Context:** CSS can use hex (#00E5E5) or RGB (0, 229, 229) depending on whether transparency is needed.

**Decision:** Document both formats for every color in token tables.

**Rationale:**
- Solid colors: Hex is more readable (#00E5E5 vs "0, 229, 229")
- Transparent colors: RGB needed for rgba() function
- Rails developer shouldn't have to convert between formats

**Alternative Considered:** Only hex (Rails dev converts to RGB when needed), or only RGB (less readable).
**Why Not:** Adds friction; Rails dev has to pause to convert colors.

**Impact:** Wider tables but immediate value for both use cases.

---

### 4. Technology-Neutral Language Throughout

**Context:** Source code is React (components, hooks, JSX). Rails implementation will be ERB templates, partials, Stimulus controllers.

**Decision:** Use technology-neutral descriptions (describe WHAT visually happens, not React HOW).

**Rationale:**
- "Fixed side panel that slides in from right" transfers to any framework
- "useEffect hook with transform state" is React-specific, doesn't help Rails dev
- Behavior and visual appearance are universal; implementation patterns are not

**Alternative Considered:** Include React component names and patterns as primary documentation.
**Why Not:** Rails dev would have to mentally translate React concepts to Rails equivalents.

**Impact:** Docs are pure visual/spatial specification. React component names mentioned only as cross-references to Phase 6 code.

---

## Integration Points

### Inputs from Previous Phases

**From Phase 5 (Visual Capture):**
- **SCREENSHOT-MANIFEST.md:** 40 screenshots (20 raw + 20 annotated)
- **Used 11 screenshots** as visual truth references in LAYOUT-STRUCTURE.md:
  - 01-initial-states/000-initial-load.png (page layout, header)
  - 01-initial-states/001-empty-calendar-full-day.png (day view TimeStrip)
  - 01-initial-states/002-date-selected-with-panel.png (panel slide-in)
  - 02-slot-states/005-multi-hour-booking-block.png (overlay system)
  - 06-responsive/*.png (mobile/tablet/desktop layouts)

**From Phase 6 (Code Extraction):**
- **FILE-MANIFEST.md:** Extracted CSS files with design values
- **Used 11 CSS files** as source truth for both documents:
  - index.css (color system, timing tokens, root layout)
  - Header.css (header dimensions, button styles, animations)
  - TimeSlot.css (slot dimensions, states, keyboard focus)
  - TimeStrip.css (day view container)
  - WeekView.css (week grid layout)
  - BookingPanel.css (panel dimensions, slide animation)
  - BookingPopup.css (popup dimensions, modal backdrop)
  - BookingBlock.css (user colors, booking overlay positioning)
  - BookingOverlay.css (pointer-events strategy)

### Outputs for Next Phases

**For Phase 07-02 (Component States):**
- Layout regions documented: Can reference "header region", "panel region", "popup region"
- Design tokens extracted: Can reference colors by token name (--accent, --user-1-color)
- Containment hierarchy: Knows which components are inside which (panel-section inside BookingPanel)

**For Phase 07-03 (Animations):**
- Timing tokens documented: --transition-fast (150ms), --transition-medium (300ms)
- Animation durations extracted: pulse-glow (2s), slideIn (0.3s), etc.
- Transform patterns documented: scale(1.05), translateY(-1px), etc.

**For Phase 07-04 (Keyboard Shortcuts):**
- Keyboard focus state documented: Gold border (#fbbf24) distinguishes from mouse cyan
- Kbd element styling documented: 0.75rem, --bg-tertiary background, 6px radius

**For Phase 08 (Behavior Specification):**
- Layout regions provide context for interactions: "Click slot → panel slides in from right"
- Z-index layering explains stacking: "Popup appears above panel (201 > 100)"

---

## Technical Discoveries

### 1. Glass Morphism Implementation Details

**Found:** Glass effect uses backdrop-filter (not just opacity) for true blur-behind effect.

**Recipe:**
- Semi-transparent background (60-85% opacity)
- Backdrop filter with blur (12-20px)
- Webkit prefix needed for Safari
- Subtle cyan border for accent
- Layered box-shadows (glow + depth + inset highlight)

**Impact:** Rails needs to ensure backdrop-filter support or provide fallback (solid background at higher opacity).

**Source:** TimeStrip.css:7-15, BookingPanel.css:9-11, BookingPopup.css:24-37

---

### 2. Position-Based User Color System

**Found:** User colors assigned by array index, not user name.

**Implementation:**
- Each user has two tokens: `--user-N-color` (hex) and `--user-N-rgb` (triplet)
- Booking blocks use `rgba(var(--user-N-rgb), 0.35)` for backgrounds
- Text uses `var(--user-N-color)` directly

**Why This Matters:** Ensures color consistency when user names change. Position 1 is always green, position 2 always magenta, etc.

**Impact:** Rails implementation needs to map users to positions (not hardcode colors per user name).

**Source:** index.css:21-45, BookingBlock.css:17-219

---

### 3. Overlay Pointer Events Pattern

**Found:** BookingOverlay uses `pointer-events: none`, but children (BookingBlocks) use `pointer-events: auto`.

**Mechanism:**
- Overlay covers entire slots-container (`position: absolute`, `inset: 0`)
- Overlay is click-through (none) so clicks reach slots below
- Booking blocks restore interactivity (auto) so they're clickable
- Occupied slots have `pointer-events: none` so clicks go to blocks above

**Why This Works:** Allows empty slots to be clickable while booking blocks overlay them.

**Impact:** Rails must apply exact same pointer-events CSS classes for click-through to work.

**Source:** BookingOverlay.css:7, 11-12, TimeSlot.css:56

---

### 4. Staggered Animation Delays

**Found:** Panel sections and week columns use staggered entrance animations.

**Implementation:**
- Panel sections: Fixed delays (0ms, 50ms, 100ms) via :nth-child selectors
- Week columns: Dynamic delays via inline CSS variable `--delay`

**Effect:** Creates cascading "wave" of content appearing sequentially.

**Impact:** Rails can use same :nth-child approach for panel, needs to inject inline styles for week columns.

**Source:** BookingPanel.css:160-165, WeekView.css:50

---

### 5. Responsive Breakpoint Strategy

**Found:** Two breakpoints (600px, 768px) with different purposes.

**600px (Mobile):**
- Header stacks vertically
- Week toggle and hints bar hidden
- Panel becomes full-width
- TimeStrip expands to full width

**768px (Tablet):**
- Week view grid adjusts (70px → 60px time column)
- Font sizes reduce slightly
- Slot heights compress (30px → 28px)

**Impact:** Rails needs both media queries; 600px is major layout shift, 768px is fine-tuning.

**Source:** Header.css:251-273, WeekView.css:174-204, TimeStrip.css:26-33

---

## Quality Metrics

### Documentation Coverage

**LAYOUT-STRUCTURE.md:**
- ✅ Component hierarchy tree (App → Header → calendar → panels)
- ✅ All 5 layout regions documented (header, day grid, week grid, panel, popup)
- ✅ Day vs week view layouts (360px vs full-width grid)
- ✅ Overlay system (absolute positioning strategy)
- ✅ Z-index layering (100, 200, 201)
- ✅ Glass morphism effects (backdrop-filter + shadows)
- ✅ Responsive breakpoints (600px, 768px changes)
- ✅ 11 screenshot references (visual truth)
- ✅ 11 CSS source references (implementation truth)
- ✅ 538 lines (>100 required)

**DESIGN-TOKENS.md:**
- ✅ All 30+ CSS custom properties from index.css :root
- ✅ All 6 user colors (position-based system)
- ✅ All hardcoded colors (keyboard focus, delete button, backdrop)
- ✅ 2 font families (DM Sans, JetBrains Mono)
- ✅ 15 distinct font sizes (1.75rem to 0.6rem)
- ✅ 4 font weights (400, 500, 600, 700)
- ✅ Complete spacing scale (2px-32px)
- ✅ 2 transition tokens + 7 animation durations
- ✅ 8 border-radius values
- ✅ Box shadow patterns (glow, glass, depth, user blocks)
- ✅ Backdrop filter blur levels (4px, 12px, 16px, 20px)
- ✅ 24 CSS source references
- ✅ 711 lines (>150 required)

### Verification Checks

All 10 verification criteria met:

1. ✅ LAYOUT-STRUCTURE.md exists (538 lines)
2. ✅ Component hierarchy tree present (ASCII tree format)
3. ✅ 5 layout regions documented
4. ✅ Day/week view layouts documented
5. ✅ Overlay system documented
6. ✅ DESIGN-TOKENS.md exists (711 lines)
7. ✅ All CSS custom properties covered (30+)
8. ✅ Both font families documented
9. ✅ Timing section covers transitions + animations
10. ✅ Technology-neutral language throughout

---

## Deviations from Plan

**None.** Plan executed exactly as written.

Both documents created with all required sections:
- Layout doc: hierarchy, regions, day/week views, overlay, glass effects, z-index, responsive
- Tokens doc: colors, typography, spacing, timing, borders, shadows, filters, special patterns

All verification criteria passed:
- Screenshot references: 11 (≥5 required)
- CSS source references: 35 total across both docs (≥28 required)
- Line counts: 538 + 711 = 1249 (≥250 required)
- Technology-neutral: No React hooks/components in descriptions
- Every value traceable: Hex, RGB, usage, source for all tokens

---

## Next Phase Readiness

### Immediate Next Step: Phase 07-02 (Component States)

**What's Ready:**
- Layout vocabulary established: Can reference "TimeSlot", "BookingPanel", "popup-overlay" etc.
- Design token vocabulary established: Can reference "--accent", "--user-1-color", "blur(20px)" etc.
- Screenshot manifest available: Can document which screenshots show which states
- CSS state classes extracted: Available state (.available), selected state (.selected), etc.

**What's Needed for 07-02:**
- Document all interactive element states (default, hover, focus, active, disabled)
- Create state matrix tables (component × state × visual appearance)
- Reference layout regions for spatial context ("panel-section option-btn selected state")
- Reference design tokens for visual values ("background: --accent, color: --bg-primary")

### Readiness Checklist

**For Component State Documentation (07-02):**
- ✅ Layout regions defined (know where components exist)
- ✅ Design tokens extracted (know what colors/sizes to reference)
- ✅ Screenshot manifest available (can identify which screenshots show states)
- ✅ CSS state classes documented (can trace from CSS to visual appearance)

**For Animation Documentation (07-03):**
- ✅ Timing tokens defined (--transition-fast, --transition-medium)
- ✅ Animation durations extracted (pulse-glow 2s, fadeIn 0.15s, etc.)
- ✅ Keyframe definitions referenced (source files identified)
- ✅ Transform patterns documented (scale, translateX, translateY values)

**For Keyboard Shortcut Documentation (07-04):**
- ✅ Keyboard focus state color documented (#fbbf24 gold)
- ✅ Kbd element styling documented (size, background, border)
- ✅ Hint bar structure documented (header-hints section)

**For Responsive Documentation (07-05):**
- ✅ Breakpoints documented (600px, 768px)
- ✅ Layout changes enumerated (header stacks, panel full-width, hidden elements)
- ✅ Mobile screenshots available (06-responsive/)

### Blockers/Concerns

**None identified.** All prerequisites for remaining Phase 7 plans are satisfied.

---

## Files Created

```
.planning/phases/07-ui-ux-documentation/
├── LAYOUT-STRUCTURE.md (538 lines)
│   └── Complete spatial hierarchy and component tree
└── DESIGN-TOKENS.md (711 lines)
    └── Exhaustive design token reference

Total: 2 files, 1249 lines
```

---

## Commits

| Commit | Message | Files | LOC |
|--------|---------|-------|-----|
| 47562b1 | docs(07-01): create layout structure documentation | LAYOUT-STRUCTURE.md | +538 |
| 9340dca | docs(07-01): create design tokens reference | DESIGN-TOKENS.md | +711 |

**Total:** 2 commits, 2 files, +1249 LOC

---

## Lessons Learned

### What Went Well

1. **Comprehensive Token Extraction:** Including both hex and RGB for all colors saved future conversion work.
2. **Technology-Neutral Language:** Describing WHAT (not React HOW) keeps docs framework-agnostic.
3. **Screenshot References:** 11 screenshot links provide visual truth alongside CSS source truth.
4. **Pattern Documentation:** Glass morphism recipe and overlay pointer-events pattern are reusable.

### What Could Be Improved

1. **Token Organization:** Could group tokens by usage pattern (interactive, glass, depth) instead of by type (color, shadow, border).
2. **Cross-References:** Could add more explicit "See DESIGN-TOKENS.md:Color System" links from LAYOUT-STRUCTURE.md.

### Reusable Patterns for Future Plans

**For Component State Docs (07-02):**
- Use same table format (state, visual, trigger, behavior, screenshot)
- Reference layout regions by name from LAYOUT-STRUCTURE.md
- Reference design tokens by name from DESIGN-TOKENS.md

**For Animation Docs (07-03):**
- Use timing token names (--transition-fast) instead of raw values (150ms)
- Reference keyframe source locations from DESIGN-TOKENS.md
- Document WHAT animates (not JavaScript trigger logic)

---

## Time Breakdown

| Activity | Duration | Notes |
|----------|----------|-------|
| Context loading | 1 min | Read STATE.md, 07-RESEARCH.md, SCREENSHOT-MANIFEST.md |
| CSS file reading | 1 min | Read all 9 CSS files (index, Header, TimeSlot, etc.) |
| LAYOUT-STRUCTURE.md creation | 2 min | Write hierarchy tree, regions, overlay system, responsive |
| DESIGN-TOKENS.md creation | 2 min | Extract colors, typography, spacing, timing, shadows |
| Verification + commits | <1 min | Grep checks, git commits |

**Total:** 6 minutes for complete plan execution

---

**Phase 07 Plan 01: COMPLETE**

Foundation established for all remaining UI/UX documentation. Rails developer now knows:
- **WHERE** everything goes (LAYOUT-STRUCTURE.md)
- **WHAT** visual values to use (DESIGN-TOKENS.md)

Next: Document component states across all interactive elements (07-02).
