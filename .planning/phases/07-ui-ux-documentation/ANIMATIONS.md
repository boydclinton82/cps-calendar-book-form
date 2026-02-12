# Animations & Transitions Documentation

**Phase:** 07-ui-ux-documentation
**Created:** 2026-02-13
**Purpose:** Complete specification of all CSS animations, transitions, and motion design in the booking form

This document provides exhaustive animation specifications including keyframe definitions, transition behaviors, timing functions, and glass morphism effects. Every animation is documented with trigger conditions, duration, easing, property changes, and CSS source references.

## Overview

The booking form uses two types of motion:

1. **CSS Transitions**: Smooth property changes triggered by state changes (hover, focus, open/close)
2. **CSS Keyframe Animations**: Predefined animation sequences (pulses, slides, fades)

All animations follow consistent timing patterns defined by design tokens and use easing functions that create natural, organic motion.

---

## 1. CSS Transition Tokens

Two global transition presets used throughout the application.

| Token | Value | Easing | Usage | Source |
|-------|-------|--------|-------|--------|
| `--transition-fast` | 150ms | ease-out | Button hovers, slot state changes, text color changes, border changes, opacity transitions | index.css:10 |
| `--transition-medium` | 300ms | ease-out | Panel slide-in/out, content appearance, larger transformations | index.css:11 |

### Elements Using --transition-fast (150ms)

**Time Slots:**
- `.time-slot` - all property changes (background, border, box-shadow, transform)
- `.time-label` - color transitions
- Source: TimeSlot.css:13, 72

**Header Buttons:**
- `.book-now-btn` - background, transform, box-shadow on hover
- `.week-toggle` - background, border, box-shadow on hover/active
- `.timezone-toggle` - background, border, box-shadow on hover/active
- `.nav-btn` - background, transform, box-shadow on hover/active
- Source: Header.css:52, 89, 120, 159

**Panel & Popup Buttons:**
- `.option-btn` - background, border, transform on hover/selected
- `.cancel-btn` - background, border, color on hover
- `.done-btn` - background, border, box-shadow, transform on hover
- `.delete-btn` - background, border, box-shadow, transform on hover
- `.close-btn` - background, border, color on hover
- Source: BookingPanel.css:78, 131; BookingPopup.css:112, 174, 202, 229

**Booking Blocks:**
- `.booking-block` - background, border, box-shadow, transform on hover
- `.booking-block-info` - text-shadow on hover
- `.booking-block-cancel-hint` - opacity fade-in on hover
- Source: BookingBlock.css:12, 224, 236

**Week View:**
- `.column-header` - background, border on hover
- `.week-slot` - background, border, box-shadow on hover
- Source: WeekView.css:97, 138

### Elements Using --transition-medium (300ms)

**Booking Panel:**
- `.booking-panel` - transform (slide-in/out)
- Source: BookingPanel.css:18

**Staggered Content Animations:**
- Panel sections use staggered delays with 300ms base duration
- Week columns use staggered delays with 400ms base duration

---

## 2. Keyframe Animations

### 2.1. pulse-glow (Book Now Button Pulse)

**Component:** Book Now button in header
**Trigger:** Button is visible (current hour is available for booking)
**Duration:** 2s
**Easing:** ease-in-out
**Loop:** infinite
**Purpose:** Draws attention to quick booking option

**Properties Animated:**
- `box-shadow` - glow intensity oscillates

**Keyframe Definition:**
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow:
      0 0 16px var(--accent-glow-strong),
      inset 0 0 12px rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow:
      0 0 24px var(--accent-glow-strong),
      0 0 32px var(--accent-glow),
      inset 0 0 16px rgba(255, 255, 255, 0.15);
  }
}
```

**Pause Condition:** Animation pauses on hover (`animation: none`)

**Source:** Header.css:57-64

**Screenshot:** 04-book-now-button/001-book-now-visible.png (shows button with glow)

---

### 2.2. glowPulse (Booking Confirmation)

**Component:** Time slot
**Trigger:** Slot just received a new booking (applied momentarily after booking confirmation)
**Duration:** 0.6s
**Easing:** ease-out
**Loop:** Single play (not infinite)
**Purpose:** Visual confirmation that booking was successful

**Properties Animated:**
- `box-shadow` - cyan glow pulse from 0 to strong

**Keyframe Definition:**
```css
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--accent-glow);
  }
  50% {
    box-shadow: 0 0 30px var(--accent-glow-strong);
  }
}
```

**Applied Class:** `.time-slot.just-booked`

**Source:** TimeSlot.css:91-102

**Screenshot:** Not captured (transient animation, <1 second)

---

### 2.3. keyboardFocusPulse (Keyboard Navigation Indicator)

**Component:** Time slot
**Trigger:** Time slot has keyboard focus (tab key navigation)
**Duration:** 1.5s
**Easing:** ease-in-out
**Loop:** infinite
**Purpose:** Visually distinguish keyboard focus from mouse selection (uses gold instead of cyan)

**Properties Animated:**
- `box-shadow` - gold/amber glow intensity oscillates
- `outline` - gold outline intensity oscillates

**Keyframe Definition:**
```css
@keyframes keyboardFocusPulse {
  0%, 100% {
    box-shadow:
      0 0 0 3px rgba(251, 191, 36, 0.3),
      0 0 16px rgba(251, 191, 36, 0.4);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(251, 191, 36, 0.5),
      0 0 24px rgba(251, 191, 36, 0.6);
  }
}
```

**Applied Class:** `.time-slot.keyboard-focused`

**Color:** #fbbf24 (gold/amber) - intentionally different from cyan to distinguish keyboard from mouse interaction

**Source:** TimeSlot.css:119-130

**Screenshot:** Not captured (keyboard interaction not in screenshot set)

---

### 2.4. fadeIn (Popup Overlay Backdrop)

**Component:** Popup overlay backdrop (dark semi-transparent layer behind popup)
**Trigger:** Booking popup opens
**Duration:** 0.15s (150ms)
**Easing:** ease-out
**Loop:** Single play
**Purpose:** Smooth appearance of modal backdrop

**Properties Animated:**
- `opacity` - 0 → 1

**Keyframe Definition:**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Applied Class:** `.popup-overlay`

**Source:** BookingPopup.css:41-48

**Paired With:** popupSlideIn (content appears simultaneously)

---

### 2.5. popupSlideIn (Popup Content Entrance)

**Component:** Booking popup content
**Trigger:** Booking popup opens (paired with fadeIn for backdrop)
**Duration:** 0.2s (200ms)
**Easing:** ease-out
**Loop:** Single play
**Purpose:** Smooth entrance of popup dialog from slightly above center

**Properties Animated:**
- `opacity` - 0 → 1
- `transform` - translateY(-48%) → translateY(-50%) (subtle upward slide into final position)

**Keyframe Definition:**
```css
@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
```

**Applied Class:** `.booking-popup`

**Note:** Popup is positioned at `top: 50%, left: 50%, transform: translate(-50%, -50%)` for centering. Animation starts 2% higher (-48%) and slides to final centered position (-50%).

**Source:** BookingPopup.css:50-59

**Screenshot:** Not captured (animation is brief <0.3s total)

---

### 2.6. slideIn (Panel Content Stagger)

**Component:** Booking panel sections (user selection, duration selection)
**Trigger:** Booking panel opens
**Duration:** 0.3s (300ms)
**Easing:** ease-out
**Loop:** Single play
**Purpose:** Cascading "wave" effect where panel sections appear sequentially from top to bottom

**Properties Animated:**
- `opacity` - 0 → 1
- `transform` - translateX(20px) → translateX(0) (slides in from right)

**Keyframe Definition:**
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**Applied Classes:**
- `.booking-panel.open .panel-section` (all sections)
- Staggered delays via `:nth-child` selectors:
  - 2nd section: 0.05s delay (50ms)
  - 3rd section: 0.1s delay (100ms)

**Total Cascade Duration:** 0.3s + 0.1s = 0.4s for all sections to fully appear

**Source:** BookingPanel.css:155-177 (keyframes + delay assignments)

**Screenshot:** Not captured (animation is brief)

---

### 2.7. slideInDay (Week View Column Entrance)

**Component:** Week view day columns
**Trigger:** Week view loads or transitions from day view
**Duration:** 0.4s (400ms)
**Easing:** ease-out
**Loop:** Single play
**Purpose:** Cascading entrance of week columns from left to right

**Properties Animated:**
- `opacity` - 0 → 1
- `transform` - translateX(20px) → translateX(0) (slides in from right)

**Keyframe Definition:**
```css
@keyframes slideInDay {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**Applied Class:** `.day-column`

**Stagger Implementation:** Dynamic delays via inline CSS variable `--delay`
- Each column receives `style="--delay: Nms"` where N increments per column
- Typical delays: 0ms, 50ms, 100ms, 150ms, 200ms, 250ms, 300ms (for 7 days)

**Total Cascade Duration:** 0.4s + 0.3s = 0.7s for all columns to fully appear

**Source:** WeekView.css:48-62 (keyframes + animation assignment)

**Screenshot:** Not captured (week view animation)

---

## 3. Transition Behaviors (Non-Keyframe Animations)

### 3.1. Panel Slide-In/Out

**Component:** Booking panel (side panel that slides from right edge)
**Property:** `transform` (translateX)
**Duration:** var(--transition-medium) = 300ms
**Easing:** ease-out

**States:**
- **Closed:** `transform: translateX(100%)` (fully off-screen to the right)
- **Open:** `transform: translateX(0)` (visible in viewport)

**Trigger:**
- Open: User clicks available time slot
- Close: User clicks cancel, completes booking, or clicks outside panel

**Source:** BookingPanel.css:17-18 (closed state), 23-24 (open state)

**Screenshot:**
- Before: 01-initial-states/001-empty-calendar-full-day.png
- After: 01-initial-states/002-date-selected-with-panel.png

---

### 3.2. Button Hover Transforms

All interactive buttons have subtle hover transforms for tactile feedback.

| Component | Default Transform | Hover Transform | Active Transform | Duration | Source |
|-----------|-------------------|-----------------|------------------|----------|--------|
| **Book Now** | none | scale(1.05) | (no active state) | --transition-fast (150ms) | Header.css:68 |
| **Nav Buttons** | none | scale(1.08) | scale(0.98) | --transition-fast | Header.css:165, 170 |
| **Panel Options** | none | translateX(4px) | (no active state) | --transition-fast | BookingPanel.css:84 |
| **Done/Delete Buttons** | none | scale(1.02) | (no active state) | --transition-fast | BookingPopup.css:181, 209 |
| **Available Slot** | none | translateY(-1px) | (no active state) | --transition-fast | TimeSlot.css:36 |
| **Booking Block** | none | translateY(-1px) | (no active state) | --transition-fast | BookingBlock.css:39 |

**Pattern:**
- **Scale transforms** (1.02 - 1.08): Used for clickable buttons, creates "grow" effect
- **TranslateX(4px)**: Used for panel option buttons, creates indent/selection suggestion
- **TranslateY(-1px)**: Used for slots and blocks, creates subtle "lift" effect
- **Active scale(0.98)**: Press-down effect for navigation buttons

---

### 3.3. Opacity Transitions

| Component | Property | Default | Hover/Active | Duration | Trigger | Source |
|-----------|----------|---------|--------------|----------|---------|--------|
| **Booking Block Cancel Hint** | opacity | 0 (hidden) | 1 (visible) | --transition-fast | Mouse over booking block | BookingBlock.css:236, 240-242 |
| **Book Now Kbd Shortcut** | opacity | 0.9 | (same) | N/A | Static | Header.css:74 |
| **Option Key Labels** | opacity | 0.8 | (same for default), 0.8 (selected) | --transition-fast | State change | BookingPanel.css:107 |

**Fade-in Pattern:**
- Cancel hint on booking blocks fades from invisible to visible on hover
- Provides progressive disclosure of deletion affordance

---

### 3.4. Color & Border Transitions

All color and border changes use --transition-fast (150ms ease-out).

**Time Label Color:**
- Default: rgba(140, 170, 200, 0.9) (muted blue-gray)
- Available: var(--accent) #00E5E5 (cyan)
- Keyboard-focused: #fbbf24 (gold)
- Source: TimeSlot.css:71-76, 114-117

**Button Border Color:**
- Toggle buttons: transparent → var(--border-glow) on hover → var(--accent) when active
- Cancel button: var(--border-subtle) → rgba(220,38,38,0.4) red on hover
- Source: Header.css:84-96; BookingPanel.css:135-138

**Background Color:**
- Available slots: rgba(15,25,45,0.7) → rgba(0,229,229,0.08) on hover
- Booking blocks: rgba(user-rgb, 0.35) → rgba(user-rgb, 0.18) on hover (lower opacity reveals underlying slot)
- Source: TimeSlot.css:21, 30; BookingBlock.css:19, 33

---

## 4. Animation Summary Table

Complete reference of all animations in one table.

| Animation Name | Component | Duration | Easing | Loop | Trigger | Properties | Source |
|----------------|-----------|----------|--------|------|---------|------------|--------|
| **pulse-glow** | Book Now button | 2s | ease-in-out | infinite | Button visible | box-shadow (glow intensity) | Header.css:57-64 |
| **glowPulse** | Time slot | 0.6s | ease-out | once | Booking created | box-shadow (confirmation pulse) | TimeSlot.css:91-102 |
| **keyboardFocusPulse** | Time slot | 1.5s | ease-in-out | infinite | Keyboard focus | box-shadow (gold glow) | TimeSlot.css:119-130 |
| **fadeIn** | Popup overlay | 0.15s | ease-out | once | Popup opens | opacity (0 → 1) | BookingPopup.css:41-48 |
| **popupSlideIn** | Popup content | 0.2s | ease-out | once | Popup opens | opacity + transform (slide from above) | BookingPopup.css:50-59 |
| **slideIn** | Panel sections | 0.3s | ease-out | once | Panel opens | opacity + transform (slide from right) | BookingPanel.css:168-177 |
| **slideInDay** | Week columns | 0.4s | ease-out | once | Week view loads | opacity + transform (slide from right) | WeekView.css:53-62 |
| **Panel slide** | Booking panel | 0.3s | ease-out | N/A (transition) | Panel opens/closes | transform (translateX 100% → 0) | BookingPanel.css:18 |
| **Button scale** | Various buttons | 0.15s | ease-out | N/A (transition) | Hover | transform (scale 1.02-1.08) | Multiple files |
| **Slot lift** | Slots/blocks | 0.15s | ease-out | N/A (transition) | Hover | transform (translateY -1px) | TimeSlot.css:36, BookingBlock.css:39 |
| **Cancel hint fade** | Booking block hint | 0.15s | ease-out | N/A (transition) | Hover | opacity (0 → 1) | BookingBlock.css:236 |

**Total Keyframe Animations:** 7
**Total Transition Behaviors:** 10+

---

## 5. Glass Morphism Effects

Glass morphism creates translucent, frosted-glass appearance using backdrop-filter blur with semi-transparent backgrounds.

### Backdrop Filter Blur Levels

| Blur Level | Value | Usage | Components | Source |
|------------|-------|-------|------------|--------|
| **Subtle** | blur(4px) | Popup overlay backdrop (dims background without heavy blur) | `.popup-overlay` | BookingPopup.css:8 |
| **Medium** | blur(12px) | Header hints bar (readable text behind glass) | `.header-hints` | Header.css:205 |
| **Strong** | blur(16px) | Week view grid (calendar structure behind glass) | `.week-grid` | WeekView.css:14 |
| **Very Strong** | blur(20px) | Booking panel, booking popup (primary glass containers) | `.booking-panel`, `.booking-popup` | BookingPanel.css:10, BookingPopup.css:25 |

### Glass Effect Recipe

Complete glass morphism implementation pattern:

```css
/* Strong glass effect (panel/popup) */
background: var(--glass-bg);                /* rgba(15, 29, 50, 0.6) - 60% opacity */
backdrop-filter: blur(20px);                /* Blur content behind */
-webkit-backdrop-filter: blur(20px);        /* Safari support */
border: 1px solid var(--glass-border);      /* rgba(0, 229, 229, 0.2) - subtle cyan */
box-shadow:
  0 0 40px rgba(0, 229, 229, 0.08),        /* Subtle cyan glow */
  0 8px 32px rgba(0, 0, 0, 0.5);           /* Depth shadow */
```

**Components Using Glass Effect:**
1. **TimeStrip** (day view calendar container) - blur(20px) - TimeStrip.css:7-15
2. **BookingPanel** (side panel) - blur(20px) - BookingPanel.css:9-11
3. **BookingPopup** (modal dialog) - blur(20px) - BookingPopup.css:24-37
4. **WeekView** (.week-grid) - blur(16px) - WeekView.css:13-21
5. **Header hints bar** - blur(12px) - Header.css:204-206
6. **Popup overlay** - blur(4px) - BookingPopup.css:7-9

**Browser Compatibility:**
- Modern Chrome/Edge/Safari: Full support
- Firefox: Partial support (may need fallback)
- Fallback: Increase background opacity if backdrop-filter unsupported

---

## 6. Timing Philosophy

Animation timing follows industry standards for UI transitions:

| Duration Range | Usage | Perception | Examples |
|----------------|-------|------------|----------|
| **<100ms** | Instant feedback | Imperceptible as animation, feels instant | Not used in this app |
| **100-200ms** | Quick transitions | Fast but smooth, doesn't slow interaction | --transition-fast (150ms), fadeIn (150ms), popupSlideIn (200ms) |
| **200-400ms** | Standard transitions | Comfortable speed, clearly animated | --transition-medium (300ms), slideIn (300ms), slideInDay (400ms) |
| **400-1000ms** | Slow transitions | Deliberate motion, draws attention | Not used for basic transitions |
| **1000ms+** | Attention-grabbing | Looping animations, ambient effects | pulse-glow (2s loop), keyboardFocusPulse (1.5s loop) |

**Easing Functions:**
- **ease-out** (primary): Fast start, slow end - feels responsive (user action causes immediate response)
- **ease-in-out** (secondary): Smooth both ends - feels organic (ambient animations like pulses)

**Stagger Delays:**
- Panel sections: 50ms increments (creates 100ms total cascade)
- Week columns: 50ms increments (creates 300ms total cascade)
- Perception: Content "flows" into view rather than "popping" in

**Source:** Nielsen Norman Group research indicates 300ms is optimal for most UI transitions (feels responsive without being rushed).

---

## 7. Motion Patterns Summary

### Entrance Animations

| Component | Direction | Duration | Pattern | Purpose |
|-----------|-----------|----------|---------|---------|
| **Panel** | Slide from right | 300ms | translateX(100% → 0) | Matches physical sliding drawer metaphor |
| **Popup** | Slide from above center | 200ms | translateY(-48% → -50%) + fadeIn | Subtle downward motion + fade prevents jarring pop-in |
| **Panel sections** | Slide from right | 300ms staggered | Cascade with 50ms delays | Creates flow, prevents simultaneous appearance |
| **Week columns** | Slide from right | 400ms staggered | Cascade with 50ms delays | Left-to-right reading order |

### Hover Feedback Animations

| Component | Effect | Duration | Purpose |
|-----------|--------|----------|---------|
| **Buttons** | Scale up | 150ms | Suggests clickability, creates "grow" affordance |
| **Nav buttons** | Scale up + active scale down | 150ms | Press-down effect simulates physical button |
| **Slots/blocks** | Lift up | 150ms | Separates element from background, suggests interactivity |
| **Panel options** | Indent right | 150ms | Suggests selection, visual "nesting" into panel |

### Attention-Drawing Animations

| Component | Effect | Duration | Purpose |
|-----------|--------|----------|---------|
| **Book Now button** | Pulsing glow | 2s loop | Draws eye to quick-booking CTA |
| **Keyboard focus** | Pulsing gold border | 1.5s loop | Indicates current keyboard position |
| **Just-booked slot** | Confirmation pulse | 0.6s once | Immediate feedback that action succeeded |

### Progressive Disclosure

| Component | Effect | Duration | Purpose |
|-----------|--------|----------|---------|
| **Cancel hint** | Fade in on hover | 150ms | Reveals deletion affordance only when relevant |

---

## 8. Cross-References

**Referenced from COMPONENT-STATES.md:**
- State transitions (what triggers animations)
- Visual property changes during animations
- Hover/active/focus states that use transitions

**Referenced from DESIGN-TOKENS.md:**
- --transition-fast (150ms ease-out)
- --transition-medium (300ms ease-out)
- --accent-glow, --accent-glow-strong (box-shadow values used in animations)
- --glass-bg, --glass-border (backdrop-filter contexts)

**For Phase 08 Behavior Specification:**
- Animation timing determines UX flow pacing
- Stagger patterns define sequential vs simultaneous interactions
- Entrance/exit animations define modal lifecycle

**CSS Source Files:**
- index.css (transition tokens)
- TimeSlot.css (glowPulse, keyboardFocusPulse, hover transitions)
- Header.css (pulse-glow, button hover transforms)
- BookingPanel.css (panel slide, slideIn stagger)
- BookingPopup.css (fadeIn, popupSlideIn)
- BookingBlock.css (hover lift, cancel hint fade)
- WeekView.css (slideInDay stagger)

---

## 9. Implementation Notes for Rails

**Keyframe Animations:**
- Copy @keyframes definitions exactly (timing and easing matter for perceived quality)
- Ensure animation classes applied/removed at correct lifecycle points
- Test on target browsers (Safari requires -webkit-backdrop-filter prefix)

**Transitions:**
- Apply transition property to base element, not hover state (allows smooth return to default)
- Use will-change: transform for panel slide if performance issues arise
- Test transition performance on mobile (300ms may feel slower on lower-end devices)

**Stagger Delays:**
- Panel sections: Use :nth-child(N) selectors with fixed delays
- Week columns: Inject inline --delay CSS variable per column
- Consider reducing stagger on mobile if animation feels slow

**Glass Morphism:**
- Provide solid background fallback if backdrop-filter unsupported
- Test readability of text over blurred backgrounds
- Adjust blur intensity if performance issues (reduce from 20px to 12px)

**Accessibility:**
- Respect prefers-reduced-motion media query (disable animations if user prefers)
- Ensure animations don't convey critical information (use as enhancement only)
- Test keyboard focus pulse is visible for keyboard-only users

---

**Documentation Complete:** 2026-02-13
**Technology-neutral:** All animations described by CSS properties and timing
**Rails-ready:** Every animation traceable to CSS source for accurate recreation
**Total animations documented:** 7 keyframes + 10+ transitions + 6 glass effects = 23+ motion specifications
