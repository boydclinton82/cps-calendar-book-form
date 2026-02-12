# Phase 7: UI/UX Documentation - Research

**Researched:** 2026-02-13
**Domain:** UI/UX specification documentation, design system creation, visual design extraction
**Confidence:** HIGH

## Summary

Phase 7 requires creating exhaustive UI/UX documentation that enables perfect recreation of the booking form in Rails. This research covers best practices for documenting layout structure, extracting design tokens from CSS, documenting component states and behaviors, capturing animations/transitions, and organizing keyboard shortcuts.

The standard approach in 2026 emphasizes **logic-driven documentation** where component behavior and state transitions are as important as visual appearance. Modern UI specifications document not just "what it looks like" but "how it behaves" across all interactive states. Design tokens (colors, spacing, typography) should be extracted as named variables, and every component state (default, hover, focus, active, disabled) must be explicitly documented.

For this phase, we have two authoritative sources: Phase 5 screenshots (20 annotated + 20 raw = visual truth) and Phase 6 extracted code (CSS files with design tokens, component files with interaction logic). The task is to synthesize these into a comprehensive specification that another developer can use to recreate the interface pixel-perfectly in a different technology.

**Primary recommendation:** Create structured specification documents organized by UI layer (layout, design tokens, components, interactions, animations) with each component documented across all states, supported by screenshot references and extracted CSS values.

## Standard Stack

Modern UI/UX specification documentation doesn't require special libraries, but follows established patterns for organizing design systems.

### Core Documentation Format

| Format | Purpose | Why Standard |
|--------|---------|--------------|
| Markdown | Structured text docs | GitHub/GitLab native, version control friendly, easy diffs |
| Screenshots | Visual truth reference | Captures actual rendered output, non-ambiguous |
| Design Tokens | CSS variables/JSON | Technology-neutral, maps to any framework (CSS custom props, SCSS vars, Tailwind config) |
| State Tables | Component state matrix | Enumerates all possible states explicitly, prevents missed edge cases |

### Supporting Tools (Optional)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| Figma/Sketch | Visual design source | When design exists in design tool (not applicable here - extracting from live site) |
| Storybook | Interactive component catalog | When building design system for reuse (not needed for one-off spec) |
| Browser DevTools | CSS inspection | Extract computed styles, measure spacing, verify colors |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Markdown docs | Notion/Confluence | Markdown is version-controlled, portable, and renders in GitHub |
| Manual extraction | Automated CSS parsers | Manual ensures accuracy for this one-time extraction; automation better for ongoing maintenance |
| Separate docs | Inline code comments | Separate docs create comprehensive reference; inline better for implementation hints |

**Tools needed:**
- Text editor (for Markdown)
- Browser DevTools (for CSS inspection)
- Image viewer (for screenshot reference)

No installation required - all standard development tools.

## Architecture Patterns

### Recommended Documentation Structure

```
.planning/phases/07-ui-ux-documentation/
├── 07-01-LAYOUT-STRUCTURE.md       # Layout hierarchy, component tree
├── 07-02-DESIGN-TOKENS.md          # Colors, typography, spacing, timing
├── 07-03-COMPONENT-STATES.md       # All interactive element states
├── 07-04-ANIMATIONS.md             # Transitions, keyframes, timing functions
├── 07-05-KEYBOARD-SHORTCUTS.md     # All shortcuts with conditional logic
├── 07-06-RESPONSIVE-BEHAVIOR.md    # Breakpoints, layout adaptations
└── 07-RESEARCH.md                  # This file
```

Each document serves a distinct purpose for the Rails implementer.

### Pattern 1: Design Token Extraction

**What:** Extract all CSS custom properties and computed values into named variables
**When to use:** Always - design tokens are the foundation of consistent visual design

**Structure:**
```markdown
## Color Tokens

| Token Name | Value | Usage | Source |
|------------|-------|-------|--------|
| `--bg-primary` | `#0a1628` | Main background | index.css:3 |
| `--accent` | `#00E5E5` | Primary interactive color | index.css:9 |
```

**Example from project:**
```css
/* Source: extracted-code/src/index.css */
:root {
  --accent: #00E5E5;
  --available: #00E5E5;
  --booked: #dc2626;
  --user-1-color: #4ADE80;
}
```

This becomes a Rails implementation guide:
```ruby
# app/assets/stylesheets/variables.css
:root {
  --accent: #00E5E5;
  /* ... rest of tokens */
}
```

**Source:** [Design Tokens | U.S. Web Design System](https://designsystem.digital.gov/design-tokens/)

### Pattern 2: Component State Matrix

**What:** Document every possible state for each interactive component
**When to use:** For all clickable, hoverable, or focusable elements

**Structure:**
```markdown
## Component: Time Slot

| State | Visual Appearance | Trigger | Behavior | Screenshot |
|-------|-------------------|---------|----------|------------|
| Available | Cyan border (#00E5E5), subtle glow | Slot is bookable | Clickable, opens booking panel | 02-slot-states/001 |
| Available:hover | Brighter cyan, stronger glow | Mouse over available slot | Cursor: pointer, slight translateY | Same file |
| Selected | Intense cyan glow, 2px border | Slot clicked | Panel opens, slot highlighted | 01-initial-states/002 |
| Booked | Red background (#dc2626) | Booking exists | Non-interactive, shows user | 02-slot-states/002 |
| Past | Opacity 0.35, grayed out | Time has passed | Non-interactive, disabled | 02-slot-states/003 |
| Keyboard-focused | Gold border (#fbbf24), pulsing | Tab key navigation | Press Enter to select | N/A (not captured) |
```

**Why this matters:** The five main button states (enabled, disabled, hovered, focused, pressed) must all be explicitly documented. Without this, developers guess, leading to inconsistent behavior.

**Source:** [Button States: Communicate Interaction - Nielsen Norman Group](https://www.nngroup.com/articles/button-states-communicate-interaction/)

### Pattern 3: Animation Specifications

**What:** Document timing, easing, and property changes for all animations
**When to use:** For any visual transition (page changes, component appearance, hover effects)

**Structure:**
```markdown
## Animation: Book Now Pulse

**Trigger:** Button is visible (current hour available)
**Duration:** 2000ms infinite
**Easing:** ease-in-out
**Properties animated:**
- `box-shadow`: 0 0 16px → 0 0 24px → 0 0 16px (glow intensity)

**Keyframes:**
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 16px var(--accent-glow-strong); }
  50% { box-shadow: 0 0 24px var(--accent-glow-strong), 0 0 32px var(--accent-glow); }
}
```

**Purpose:** Draws attention to quick booking option
```

**Industry standards:**
- Transitions with 2-5 objects: 300-400ms
- Transitions with 6-10 objects: 500-700ms
- Google recommends ~300ms for most UI transitions
- Transitions exceeding 400ms feel slow

**Source:** [Executing UX Animations: Duration and Motion Characteristics - Nielsen Norman Group](https://www.nngroup.com/articles/animation-duration/)

### Pattern 4: Responsive Breakpoint Documentation

**What:** Document layout changes at each breakpoint with before/after comparisons
**When to use:** Always for responsive interfaces

**Structure:**
```markdown
## Breakpoint: Mobile (max-width: 600px)

**Changes:**
- BookingPanel: Full-screen overlay (was side panel)
- Header: Stacked layout (was horizontal)
- Hints bar: Hidden (was visible)
- Week toggle: Hidden (was visible)

**Screenshot:** 06-responsive/mobile-full-page.png
```

**Breakpoints for this project:**
- Mobile: max-width 600px (based on Header.css:251)
- Tablet: 768px (mentioned in phase context)
- Desktop: 1440px default (from screenshot manifest)

### Anti-Patterns to Avoid

**Don't: Vague descriptions**
- ❌ "Slot has a nice glow effect"
- ✅ "box-shadow: 0 0 16px rgba(0, 229, 229, 0.5)"

**Don't: Screenshot-only documentation**
- ❌ "See screenshot for colors"
- ✅ "Primary accent: #00E5E5 (var(--accent))"

**Don't: Implementation-specific instructions**
- ❌ "Use React useState for hover"
- ✅ "Hover state: border-color changes to #00ffff"

**Don't: Missing edge cases**
- ❌ Document only happy path states
- ✅ Document disabled, error, loading, empty states

## Don't Hand-Roll

Problems that look simple but have existing solutions or established patterns:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Design token extraction | Custom CSS parser | Manual extraction + DevTools | One-time extraction for single app; manual ensures accuracy |
| Screenshot annotation | Custom image editing | Existing screenshots from Phase 5 | Already complete with 20 annotated screenshots |
| State documentation | Free-form text | State matrix tables | Structured tables ensure completeness, easy to scan |
| Responsive testing | Manual window resizing | Phase 5 screenshots at 3 breakpoints | Already captured at 375/768/1440px |
| Color value extraction | Color picker guessing | CSS source files | CSS custom properties already define exact values |
| Animation timing | Visual estimation | CSS source inspection | Exact durations/easings in keyframe definitions |

**Key insight:** This phase is **synthesis, not creation**. Phase 5 produced screenshots, Phase 6 extracted code. Phase 7 combines them into structured documentation. Don't recreate what already exists - reference it.

## Common Pitfalls

### Pitfall 1: Documenting Implementation Instead of Behavior

**What goes wrong:** Documentation focuses on React-specific code patterns instead of technology-neutral behavior

**Example:**
- ❌ "Use useState to track hover state, useEffect to add event listeners"
- ✅ "On mouse enter: border changes from rgba(0,229,229,0.2) to #00E5E5, box-shadow increases intensity"

**Why it happens:** Source code is in React, easy to copy implementation details

**How to avoid:**
1. Read the CSS files for visual states (not the JSX)
2. Describe WHAT changes, not HOW it's implemented
3. Think: "Could a Vue/Rails/Angular developer implement this from my description?"

**Warning signs:**
- Documentation mentions React hooks
- Documentation uses React terminology (props, state, components)
- No CSS values, only code references

### Pitfall 2: Incomplete State Coverage

**What goes wrong:** Only "happy path" states documented (default, hover), missing disabled/error/focus states

**Why it happens:** Screenshots capture most common states, not all edge cases. Easy to forget keyboard focus, loading states, empty states.

**How to avoid:**
1. For every interactive element, check: default, hover, focus, active, disabled
2. Review keyboard shortcuts - each needs a focus state
3. Check responsive states (mobile vs desktop may have different states)
4. Verify error states (though this app may not have many)

**Example checklist for "Time Slot" component:**
- ✅ Available (default)
- ✅ Available:hover
- ✅ Selected (active)
- ✅ Booked (disabled variant)
- ✅ Past (disabled variant)
- ✅ Keyboard-focused (from useKeyboard.js but no screenshot)
- ⚠️ Just-booked animation (CSS exists, verify if needed)

**Warning signs:**
- State table has < 3 rows for interactive elements
- No mention of keyboard focus anywhere
- Responsive docs only show desktop

### Pitfall 3: Missing Visual Truth References

**What goes wrong:** Documentation describes states without linking to screenshots that prove the description is accurate

**Why it happens:** Screenshots and docs created separately, cross-referencing feels like extra work

**How to avoid:**
1. Every state description should reference a screenshot OR CSS source
2. Format: "Screenshot: 02-slot-states/001-slot-available.png" or "Source: TimeSlot.css:19-27"
3. If no screenshot exists for a state, note it: "Not captured: keyboard-focused (gold border #fbbf24)"

**Example:**
```markdown
## Booked Slot State

**Visual:** Red background (#dc2626), non-interactive
**Screenshot:** 02-slot-states/002-slot-booked-and-blocked.png
**CSS Source:** TimeSlot.css:52-56
```

**Warning signs:**
- Color values with no CSS source reference
- Animation descriptions with no keyframe code
- "The button looks like..." with no screenshot link

### Pitfall 4: Color/Spacing Values Without Context

**What goes wrong:** Raw hex codes documented without semantic meaning or usage context

**Example:**
- ❌ "Use #00E5E5"
- ✅ "Primary accent (--accent): #00E5E5 - Used for borders, interactive elements, glows"

**Why it happens:** Easy to copy hex codes from DevTools, harder to understand their purpose

**How to avoid:**
1. Document CSS custom property name first, then value
2. Add usage description: "Used for X, Y, Z"
3. Group related values (all accent variants together)

**Format:**
```markdown
| Token | Value | Usage |
|-------|-------|-------|
| --accent | #00E5E5 | Primary interactive color (borders, buttons, focus) |
| --accent-dim | #00b8b8 | Subdued variant for secondary elements |
| --accent-glow | rgba(0,229,229,0.4) | Box-shadow glow effect |
```

**Warning signs:**
- Hex codes listed without variable names
- No description of where/when to use each color
- Spacing values (8px, 16px) without semantic naming (--space-sm, --space-md)

### Pitfall 5: Ambiguous Responsive Behavior

**What goes wrong:** "Mobile layout is different" without specifying exact breakpoint or what changes

**Why it happens:** Breakpoints buried in CSS media queries, changes spread across multiple files

**How to avoid:**
1. Document exact breakpoint pixel value: "max-width: 600px"
2. List every component that changes behavior
3. Specify before/after for each change
4. Reference mobile vs desktop screenshots

**Example:**
```markdown
## Mobile Breakpoint (max-width: 600px)

**BookingPanel:**
- Desktop: 400px wide side panel, slides in from right
- Mobile: Full-screen overlay, dark backdrop behind

**Header:**
- Desktop: Horizontal layout, all buttons visible
- Mobile: Stacked layout, week toggle hidden, hints bar hidden

**Screenshots:**
- Desktop: 01-initial-states/002-date-selected-with-panel.png
- Mobile: 06-responsive/mobile-with-panel.png
```

**Warning signs:**
- "Responsive layout" with no pixel breakpoints
- "Mobile is different" with no specifics
- Single screenshot for all breakpoints

## Code Examples

These are organizational patterns, not code to copy (source is already extracted in Phase 6).

### Design Token Documentation Pattern

```markdown
## Color System

### Background Colors
| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| --bg-primary | #0a1628 | 10, 22, 40 | Main app background | index.css:3 |
| --bg-secondary | #0f1d32 | 15, 29, 50 | Card backgrounds | index.css:4 |

### Interactive Colors
| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| --accent | #00E5E5 | 0, 229, 229 | Primary interactive (borders, buttons) | index.css:9 |
| --available | #00E5E5 | 0, 229, 229 | Available slot indicator | index.css:15 |
| --booked | #dc2626 | 220, 38, 38 | Booked slot background | index.css:17 |
```

**Why RGB included:** Some CSS properties (rgba) need RGB values for transparency

### Component State Matrix Pattern

```markdown
## Component: Book Now Button

| State | Trigger | Visual Changes | Behavior | CSS Source |
|-------|---------|----------------|----------|------------|
| Default | Current hour available | Cyan background, pulsing glow animation | Clickable | Header.css:41-55 |
| Hover | Mouse over | Brighter cyan, scale 1.05, stronger glow | Cursor pointer | Header.css:66-71 |
| Hidden | Current hour unavailable/past/booked | Not rendered | N/A | App.jsx (conditional) |

**Animation:** pulse-glow, 2s ease-in-out infinite (Header.css:57-64)
**Screenshot:** 04-book-now-button/001-book-now-visible.png
```

### Animation Documentation Pattern

```markdown
## Animation: Booking Panel Slide-In

**Component:** BookingPanel
**Trigger:** User clicks available time slot
**Duration:** 300ms
**Easing:** ease-out
**Properties:**
- transform: translateX(100%) → translateX(0)

**CSS:**
```css
/* BookingPanel.css */
transition: transform 300ms ease-out;
```

**Screenshots:**
- Before: Calendar without panel
- During: Panel mid-slide (not captured - animation frame)
- After: 01-initial-states/002-date-selected-with-panel.png
```

### Keyboard Shortcut Documentation Pattern

```markdown
## Shortcut: Book Now

**Key:** `B`
**Scope:** Global (not in input/textarea)
**Condition:** Current hour must be available (not booked, not past)
**Action:**
1. Jump to today's date (if not already viewing)
2. Scroll to current hour slot
3. Select current hour slot
4. Open booking panel

**Visual feedback:**
- Book Now button pulsing when shortcut available
- Button hidden when shortcut unavailable

**Source:** useKeyboard.js:89-95
**Related UI:** Book Now button in header (Header.jsx, 04-book-now-button/)
```

## State of the Art

UI/UX documentation practices have evolved significantly in recent years:

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| Static design specs (PDFs) | Interactive, code-connected docs | 2024-2025 | Docs now link directly to production code |
| Component appearance only | Logic-driven component systems | 2025-2026 | Document behavior, not just looks |
| Manual screenshot capture | Automated visual regression testing | 2023-2024 | Screenshots generated automatically on code change |
| Separate design + dev handoff | Figma Code Connect | 2025-2026 | Design components linked to React/Swift/Android code |
| Color names ("blue", "red") | Design tokens with semantic names | 2020-2022 | Variables work across platforms |
| Explore/consider language | Prescriptive recommendations | 2024+ | "Use X" not "Consider X or Y" for specifications |

**Current state (2026):** Design systems are moving from static component libraries to comprehensive development platforms. The best systems now:
- Link Figma designs directly to production code (Code Connect)
- Provide live code editing with instant visual updates
- Auto-generate accessibility tests
- Support headless components (behavior without styling)

**For this project:** We're creating a one-off specification (not a reusable design system), so we use **simplified 2026 patterns**:
- ✅ Design tokens (semantic naming)
- ✅ State-based documentation (all states enumerated)
- ✅ Behavioral specifications (what happens, not how)
- ❌ Live code playgrounds (not needed for one-off spec)
- ❌ Automated testing (Rails team will implement their own)
- ❌ Code Connect (no Figma source)

**Sources:**
- [Building the Ultimate Design System: A Complete Architecture Guide for 2026](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999)
- [The 2026 Shift: Bridging the Gap Between Design and Dev](https://medium.com/@EmiliaBiblioKit/the-2026-shift-bridging-the-gap-between-design-and-dev-eeefb781af30)

**Deprecated/outdated:**
- Static PDF mockups: Replaced by interactive prototypes or live code examples
- "Redline" specs (design with dimension annotations): Replaced by browser DevTools inspect
- Separate style guides: Merged into design systems with components + docs in one place

## Open Questions

Things that couldn't be fully resolved through research alone:

### 1. Keyboard Focus States Not Captured

**What we know:**
- CSS defines keyboard-focused state for time slots (gold border #fbbf24)
- useKeyboard.js implements arrow key navigation
- No screenshots captured keyboard focus states

**What's unclear:**
- Should keyboard focus be documented from CSS alone?
- Are there other keyboard-focused states beyond time slots?

**Recommendation:**
- Document from CSS source (TimeSlot.css:105-130)
- Note in docs: "Not captured in screenshots - see CSS source"
- Implementation team will verify during Rails build

### 2. Loading States

**What we know:**
- useBookings.js has `loading` state
- No loading spinners/skeletons in component files
- No loading state screenshots

**What's unclear:**
- Is loading instantaneous (no visible spinner)?
- Should loading states be documented?

**Recommendation:**
- Check if loading state is ever visible to users
- If <100ms, may not need documentation (imperceptible)
- Document if implementation needs it

### 3. Error States

**What we know:**
- API can return 400/404/409 errors
- No error message UI in screenshots
- Console logging in some files

**What's unclear:**
- Are errors shown to users, or only logged?
- What does error UI look like (if any)?

**Recommendation:**
- Document API error conditions (from Phase 6)
- Note: "Error UI not visible in current implementation"
- Rails team can design their own error messages

### 4. Touch Interactions vs Mouse

**What we know:**
- Responsive screenshots show mobile layout
- No touch-specific interactions documented (swipe, long-press)

**What's unclear:**
- Do touch interactions differ from mouse (beyond hover not working)?
- Are there touch-specific gestures?

**Recommendation:**
- Document mouse interactions (click, hover)
- Assume touch is 1:1 with click (no special gestures)
- Note responsive layout changes affect touch targets (larger on mobile)

## Sources

### Primary (HIGH confidence)

**Official Documentation & Industry Standards:**
- [Design Specifications Explained for UI-UX - UXPilot](https://uxpilot.ai/blogs/design-specifications)
- [How to create a user interface specifications document (UI Spec) - StartupRocket](https://www.startuprocket.com/articles/how-to-create-a-user-interface-specifications-document-ui-spec)
- [Design System Documentation in 9 Easy Steps - UXPin](https://www.uxpin.com/studio/blog/design-system-documentation-guide/)

**Component State Standards:**
- [Button States: Communicate Interaction - Nielsen Norman Group](https://www.nngroup.com/articles/button-states-communicate-interaction/)
- [Interaction States For Dummies/Designers - Medium](https://medium.com/weave-lab/interaction-states-for-dummies-designers-f743c682fae1)
- [Handling Hover, Focus, and Other States - Tailwind CSS](https://v3.tailwindcss.com/docs/hover-focus-and-other-states)

**Design Token Standards:**
- [Design Tokens | U.S. Web Design System](https://designsystem.digital.gov/design-tokens/)
- [The developer's guide to design tokens and CSS variables - Penpot](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
- [Design Tokens beyond colors, typography, and spacing - Medium](https://medium.com/bumble-tech/design-tokens-beyond-colors-typography-and-spacing-ad7c98f4f228)

**Animation Standards:**
- [Executing UX Animations: Duration and Motion Characteristics - Nielsen Norman Group](https://www.nngroup.com/articles/animation-duration/)
- [5 steps for systematizing motion design - Design Systems](https://www.designsystems.com/5-steps-for-including-motion-design-in-your-system/)
- [Integrating Animation into a Design System - Every Interaction](https://www.everyinteraction.com/articles/integrating-animation-into-a-design-system/)

### Secondary (MEDIUM confidence)

**2026 Design System Trends:**
- [Building the Ultimate Design System: A Complete Architecture Guide for 2026 - Medium](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999)
- [The 2026 Shift: Bridging the Gap Between Design and Dev - Medium](https://medium.com/@EmiliaBiblioKit/the-2026-shift-bridging-the-gap-between-design-and-dev-eeefb781af30)
- [The Complete Guide to Design Systems in Figma (2026 Edition) - Medium](https://medium.com/@EmiliaBiblioKit/the-world-of-design-systems-is-no-longer-just-about-components-and-libraries-its-about-5beecc0d21cb)

**Practical Implementation:**
- [The Best Way to Document UX/UI Design - UIPrep](https://www.uiprep.com/blog/the-best-way-to-document-ux-ui-design)
- [Design system best practices: Components and documentation - Design Systems Collective](https://www.designsystemscollective.com/design-system-best-practices-components-and-documentation-bdb020e02172)

### Project-Specific Sources (HIGH confidence)

**Phase 5 Outputs:**
- SCREENSHOT-MANIFEST.md - 40 total screenshots (20 raw + 20 annotated)
- Screenshots organized by VCAP requirements (initial states, slot states, booking flow, etc.)

**Phase 6 Outputs:**
- FILE-MANIFEST.md - Complete code inventory with annotations
- ANNOTATIONS.md - Technology-neutral annotation guide
- extracted-code/src/index.css - Design token definitions (63 lines of CSS custom properties)
- extracted-code/src/components/*.css - Component-specific styles (12 CSS files)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Markdown + screenshots + design tokens is industry standard for UI specs
- Architecture: HIGH - Verified patterns from Nielsen Norman Group, USWDS, multiple design system sources
- Pitfalls: HIGH - Based on common documentation mistakes across multiple authoritative sources
- 2026 trends: MEDIUM - Trends are directional (Code Connect, logic-driven) but may vary by team

**Research approach:**
1. WebSearch for 2026 UI/UX specification best practices (4 searches)
2. Read Phase 5 outputs (SCREENSHOT-MANIFEST.md, sample screenshots)
3. Read Phase 6 outputs (FILE-MANIFEST.md, ANNOTATIONS.md, CSS files)
4. Cross-referenced component states, design tokens, and animation documentation standards
5. Verified against authoritative sources (Nielsen Norman Group, USWDS)

**Research limitations:**
- Focused on one-off specification (not reusable design system)
- No access to design tool source (extracting from live code, not Figma)
- Screenshots already captured (research doesn't need to recommend capture tools)

**Research date:** 2026-02-13
**Valid until:** 60 days (UI documentation practices are relatively stable; design system trends evolve slowly)

**Next phase planning can reference:**
- State matrix pattern for component documentation
- Design token extraction format
- Animation specification structure
- Keyboard shortcut documentation template
