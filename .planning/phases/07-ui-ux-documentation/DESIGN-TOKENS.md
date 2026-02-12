# UI Design Tokens

**Document Purpose:** Exhaustive extraction of all visual design values from the BMO Financial booking form. Every color, typography setting, spacing value, timing function, border radius, and shadow pattern a Rails developer needs to recreate the interface's look and feel.

**Source:** Phase 6 extracted CSS files (`.planning/phases/06-code-extraction/extracted-code/src/`)

**Format:** Token name → Value → Usage context → CSS source reference

---

## Color System

### Background Colors

| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| `--bg-primary` | `#0a1628` | 10, 22, 40 | Main app background, button text on accent elements | index.css:3 |
| `--bg-secondary` | `#0f1d32` | 15, 29, 50 | Scrollbar track, gradient midpoint | index.css:4 |
| `--bg-tertiary` | `#152238` | 21, 34, 56 | Option buttons default background, kbd elements, column headers in week view | index.css:5 |
| `--bg-card` | `rgba(15, 29, 50, 0.7)` | 15, 29, 50, 70% | Card backgrounds with translucency (not heavily used) | index.css:6 |

**Background Gradient (Full Page):**
```css
background: linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%);
background-attachment: fixed;
```
**Usage:** Body element, creates depth with diagonal gradient from dark navy to slightly lighter navy and back
**Source:** index.css:73-74

---

### Accent Colors

| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| `--accent` | `#00E5E5` | 0, 229, 229 | Primary interactive color (available slot borders, button backgrounds, focus outlines, Book Now button, toggles active state) | index.css:9 |
| `--accent-dim` | `#00b8b8` | 0, 184, 184 | Subdued variant for gradient endpoints, hover effects | index.css:10 |
| `--accent-glow` | `rgba(0, 229, 229, 0.4)` | 0, 229, 229, 40% | Box-shadow glow effects (medium intensity) | index.css:11 |
| `--accent-glow-strong` | `rgba(0, 229, 229, 0.6)` | 0, 229, 229, 60% | Box-shadow glow effects (strong intensity for active/hover states) | index.css:12 |

**Usage Pattern:** Cyan (#00E5E5) is the PRIMARY brand color. Used for all interactive elements, focus states, available slots, and accents throughout the interface.

---

### Slot State Colors

| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| `--available` | `#00E5E5` | 0, 229, 229 | Available time slot border and label color (alias of --accent) | index.css:15 |
| `--available-hover` | `#00ffff` | 0, 255, 255 | Brighter cyan for hovered available slots | index.css:16 |
| `--booked` | `#dc2626` | 220, 38, 38 | Booked slot indicator, delete button red accent | index.css:17 |
| `--booked-own` | `#3b82f6` | 59, 130, 246 | User's own bookings (blue variant, not heavily used in current design) | index.css:18 |
| `--past` | `#1e3a5f` | 30, 58, 95 | Past time slot background (darker blue-gray) | index.css:19 |

---

### User Colors (Position-Based)

**Design Pattern:** Supports up to 6 concurrent users, each assigned a color based on their position in the user list (not their name). This ensures consistent color assignment regardless of user names changing.

**Position 1 - Bright Green:**
| Token | Hex | RGB | Source |
|-------|-----|-----|--------|
| `--user-1-color` | `#4ADE80` | 74, 222, 128 | index.css:24 |
| `--user-1-rgb` | — | 74, 222, 128 | index.css:25 |

**Position 2 - Magenta/Pink:**
| Token | Hex | RGB | Source |
|-------|-----|-----|--------|
| `--user-2-color` | `#E040FB` | 224, 64, 251 | index.css:28 |
| `--user-2-rgb` | — | 224, 64, 251 | index.css:29 |

**Position 3 - Gold/Amber:**
| Token | Hex | RGB | Source |
|-------|-----|-----|--------|
| `--user-3-color` | `#FFB300` | 255, 179, 0 | index.css:32 |
| `--user-3-rgb` | — | 255, 179, 0 | index.css:33 |

**Position 4 - Purple:**
| Token | Hex | RGB | Source |
|-------|-----|-----|--------|
| `--user-4-color` | `#8B5CF6` | 139, 92, 246 | index.css:36 |
| `--user-4-rgb` | — | 139, 92, 246 | index.css:37 |

**Position 5 - Coral:**
| Token | Hex | RGB | Source |
|-------|-----|-----|--------|
| `--user-5-color` | `#FF6B6B` | 255, 107, 107 | index.css:40 |
| `--user-5-rgb` | — | 255, 107, 107 | index.css:41 |

**Position 6 - Rose:**
| Token | Hex | RGB | Source |
|-------|-----|-----|--------|
| `--user-6-color` | `#F472B6` | 244, 114, 182 | index.css:44 |
| `--user-6-rgb` | — | 244, 114, 182 | index.css:45 |

**Why Two Tokens Per User:**
- `-color` token: Used in `color` and `border` properties (hex value)
- `-rgb` token: Used in `rgba()` functions for transparency (RGB triplet)

**Usage:** BookingBlock backgrounds use `rgba(var(--user-N-rgb), 0.35)` for semi-transparent backgrounds. Borders use `rgba(var(--user-N-rgb), 0.6)`. Text uses `var(--user-N-color)` directly.

**Source:** BookingBlock.css:17-219 (all 6 user variants)

---

### Text Colors

| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| `--text-primary` | `#f0f6fc` | 240, 246, 252 | Main body text, headings, primary labels (off-white) | index.css:48 |
| `--text-secondary` | `#7d8fa3` | 125, 143, 163 | Section titles, hints bar text, subdued labels (medium gray-blue) | index.css:49 |
| `--text-muted` | `#4a5d75` | 74, 93, 117 | Hint separators, very subtle text elements (dark gray-blue) | index.css:50 |

**Usage Pattern:**
- **Primary:** Main content, button labels, slot times
- **Secondary:** Section headers ("WHO", "DURATION"), hints, day names
- **Muted:** Separators, disabled states, very subtle info

---

### Border Colors

| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| `--border-subtle` | `rgba(0, 229, 229, 0.15)` | 0, 229, 229, 15% | Panel borders, glass borders, cancel button default state | index.css:53 |
| `--border-glow` | `rgba(0, 229, 229, 0.3)` | 0, 229, 229, 30% | Hover state borders, interactive elements on hover | index.css:54 |

**Usage Pattern:** All borders use cyan with varying opacity. Subtle (15%) for resting state, glow (30%) for hover/focus.

---

### Glass Effect Colors

| Token | Hex | RGB | Usage | Source |
|-------|-----|-----|-------|--------|
| `--glass-bg` | `rgba(15, 29, 50, 0.6)` | 15, 29, 50, 60% | Background for glass panels (BookingPanel, popup, hints bar, week grid) | index.css:57 |
| `--glass-border` | `rgba(0, 229, 229, 0.2)` | 0, 229, 229, 20% | Border for glass containers (subtle cyan edge) | index.css:58 |

**Glass Morphism Recipe:**
1. Background: `var(--glass-bg)` or similar rgba with 60-85% opacity
2. Backdrop filter: `blur(12-20px)` depending on component
3. Border: `1px solid var(--glass-border)`
4. Box shadow: Cyan glow + depth shadow

**Applied To:**
- header-hints (12px blur)
- TimeStrip (20px blur, darker bg: rgba(10, 20, 35, 0.85))
- week-grid (16px blur)
- BookingPanel (20px blur)
- booking-popup (20px blur)

**Source:** Header.css:204-208, TimeStrip.css:7-15, WeekView.css:13-18, BookingPanel.css:9-11, BookingPopup.css:24-27

---

### Special Colors (Not in :root)

These colors are hardcoded in component CSS files:

**Keyboard Focus:**
- **Color:** `#fbbf24` (gold/amber)
- **RGB:** 251, 191, 36
- **Usage:** Keyboard-focused time slot border (distinct from mouse-selected cyan)
- **Source:** TimeSlot.css:106

**Delete Button Hover:**
- **Color:** `#f87171` (light red/salmon)
- **RGB:** 248, 113, 113
- **Usage:** Delete button text on hover, cancel button text on hover
- **Source:** BookingPanel.css:138, BookingPopup.css:201

**Popup Overlay Backdrop:**
- **Color:** `rgba(0, 0, 0, 0.6)` (60% black)
- **Usage:** Dark backdrop behind popup modal to dim calendar
- **Source:** BookingPopup.css:7

**Current Day Column Background (Week View):**
- **Color:** `var(--accent)` at 8% opacity (computed: rgba(0, 229, 229, 0.08))
- **Usage:** Subtle cyan glow behind today's column in week view
- **Source:** WeekView.css:72-76

**Available Slot Hover Backgrounds:**
- Day view: `rgba(0, 229, 229, 0.08)` — TimeSlot.css:30
- Week view: `rgba(0, 229, 229, 0.15)` — WeekView.css:153

---

## Typography System

### Font Families

| Name | Font Stack | Usage | Source |
|------|------------|-------|--------|
| **Primary (Sans-Serif)** | `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif` | Body text, headings, labels, buttons, all UI text | index.css:72 |
| **Monospace** | `'JetBrains Mono', 'Fira Code', monospace` | Time displays, keyboard shortcuts (kbd elements), booking block text | index.css:89-91 (.mono class) |

**Font Loading:** Assumes web fonts (DM Sans, JetBrains Mono) loaded via external source or font CDN. Falls back to system fonts if unavailable.

---

### Font Sizes

Comprehensive listing of every distinct font-size value used across the interface:

| Size (rem) | Size (px equivalent) | Usage | Source |
|------------|----------------------|-------|--------|
| `1.75rem` | ~28px | Panel/popup time display (large accent, monospace) | BookingPanel.css:42, BookingPopup.css:76 |
| `1.5rem` | ~24px | Header title | Header.css:14 |
| `1.25rem` | ~20px | Date text in header navigation | Header.css:181 |
| `1.2rem` | ~19px | Panel/popup title ("Book a time", "Edit booking") | BookingPanel.css:36, BookingPopup.css:70 |
| `1.1rem` | ~18px | Day date in week view column header | WeekView.css:128 |
| `1rem` | ~16px | Option labels (user names, duration labels) | BookingPanel.css:111, BookingPopup.css:144 |
| `0.9rem` | ~14px | Button text (Book Now, Week Toggle, Timezone Toggle) | Header.css:49, 86, 117 |
| `0.875rem` | ~14px | Time labels in time slots, booking block info text | TimeSlot.css:69, BookingBlock.css:222 |
| `0.8rem` | ~13px | Section titles ("WHO", "DURATION"), today badge, hints bar, mono text in buttons, timezone toggle mobile | BookingPanel.css:55, Header.css:187, 201, 75, 106, 137, 271 |
| `0.75rem` | ~12px | Option keys (hotkey indicators like "[J]", "[1]"), cancel/close key indicators, booking block cancel hint | BookingPanel.css:105, BookingBlock.css:232 |
| `0.7rem` | ~11px | Time cells in week view, done/delete/close key indicators in popup, day name in week view | WeekView.css:35, 120, BookingPopup.css:186, 212, 239 |
| `0.65rem` | ~10px | Time cells in week view on mobile (768px breakpoint) | WeekView.css:185 |
| `0.6rem` | ~10px | Day name in week view on mobile (768px breakpoint) | WeekView.css:194 |

**Font Size Strategy:**
- Large sizes (1.5-1.75rem): Titles and time displays (emphasis)
- Medium sizes (1-1.25rem): Primary content and labels
- Small sizes (0.8-0.9rem): Secondary info and button text
- Tiny sizes (0.7-0.75rem): Hotkey indicators and subtle hints

---

### Font Weights

| Weight | Usage | Source |
|--------|-------|--------|
| `700` (Bold) | Panel/popup time display, day date in week view, today badge | BookingPanel.css:43, WeekView.css:129, Header.css:188 |
| `600` (Semi-Bold) | Header title, button text, section titles, popup title, day name in week view | Header.css:15, 50, BookingPanel.css:56, WeekView.css:121 |
| `500` (Medium) | Date text, toggle text, time labels, option labels, booking block info | Header.css:182, 87, TimeSlot.css:70, BookingPanel.css:112, BookingBlock.css:223 |
| `400` (Regular) | Booking block cancel hint (default font-weight) | BookingBlock.css:233 |

**Font Weight Strategy:**
- **Bold (700):** High-emphasis elements (time displays, today indicator)
- **Semi-Bold (600):** Interactive elements and section headers
- **Medium (500):** Standard UI text and labels
- **Regular (400):** Very subtle hints and secondary info

---

### Letter Spacing

| Value | Usage | Source |
|-------|-------|--------|
| `-0.02em` | Header title (slightly tighter for large text) | Header.css:17 |
| `0.05em` | Day name in week view (subtle spacing for small caps) | WeekView.css:124 |
| `0.1em` | Section titles ("WHO", "DURATION"), today badge (increased spacing for uppercase) | BookingPanel.css:59, Header.css:191 |

**Usage Pattern:** Negative spacing for large headings, positive spacing for uppercase/small text for readability.

---

### Text Transform

| Value | Usage | Source |
|-------|-------|--------|
| `uppercase` | Section titles ("WHO", "DURATION"), today badge, day name in week view | BookingPanel.css:58, Header.css:190, WeekView.css:123 |

---

### Text Shadow

Used for glowing text effects:

| Value | Usage | Source |
|-------|-------|--------|
| `0 0 12px var(--accent-glow)` | Today badge glow | Header.css:192 |
| `0 0 20px var(--accent-glow)` | Panel/popup time display glow | BookingPanel.css:45, BookingPopup.css:79 |
| `0 0 10px rgba(0, 229, 229, 0.5)` | Time label glow on selected slots | TimeSlot.css:82 |
| `0 0 6px rgba(var(--user-N-rgb), 0.4)` | Booking block user text glow (default) | BookingBlock.css:29 (and variants) |
| `0 0 10px rgba(var(--user-N-rgb), 0.5)` | Booking block user text glow (hover) | BookingBlock.css:43 (and variants) |

**Pattern:** Text shadow creates subtle glow on important accent text using corresponding color at 40-50% opacity.

---

## Spacing System

All distinct padding, margin, and gap values used across components:

| Value | Usage | Source |
|-------|-------|--------|
| `2px` | Gap between day name and date in column header | WeekView.css:93 |
| `4px` | Week grid gaps, left border accent width, booking block bottom hint position | WeekView.css:11, Header.css:220, BookingBlock.css:229 |
| `6px` | Day view slot gaps, gap between hints, kbd border-radius, column header ::before inset | TimeStrip.css:23, Header.css:228, 240, WeekView.css:71 |
| `8px` | Header title padding-bottom, header-nav margin-bottom, popup header gap, Book Now button gap, week toggle gap, timezone toggle gap | Header.css:19, 145, BookingPopup.css:64, Header.css:44, 81, 112 |
| `10px` | Cancel/done/delete button gaps, option-group gap, booking block padding (mobile) | BookingPanel.css:121, 65, BookingBlock.css:246 |
| `12px` | Header-actions gap, TimeStrip padding, week-grid padding, booking block padding (vertical), panel border-radius, hints bar border-radius, nav button depth shadow | Header.css:38, TimeStrip.css:3, WeekView.css:16, BookingBlock.css:6, BookingPanel.css:76, Header.css:207, 160 |
| `14px` | Panel section gap, popup section gap, panel/popup button padding (vertical), option button gap, hints bar padding (vertical) | BookingPanel.css:51, BookingPopup.css:85, 107, 168, 70, Header.css:203 |
| `16px` | Header padding (top/bottom), TimeSlot padding (mobile), week view padding, nav button shadow, time label glow shadow size, depth shadow distance | Header.css:2, TimeStrip.css:29, WeekView.css:1, Header.css:160, TimeSlot.css:33, BookingPopup.css:35 |
| `18px` | Option button padding (horizontal), panel/popup button padding (horizontal) | BookingPanel.css:73, BookingPopup.css:107, 168 |
| `20px` | Book Now button padding (horizontal), week toggle padding (horizontal), timezone toggle padding (horizontal), TimeSlot padding (horizontal), panel header padding-bottom, popup header padding-bottom | Header.css:45, 82, 113, TimeSlot.css:8, BookingPanel.css:31, BookingPopup.css:65 |
| `24px` | Hints bar padding (horizontal), popup gap between sections, kbd min-width, kbd height, title underline glow shadow size | Header.css:203, BookingPopup.css:32, Header.css:235, 236, 32 |
| `28px` | Header-nav gap, BookingPanel padding, popup padding, panel/section gap | Header.css:144, BookingPanel.css:13, 16, BookingPopup.css:29 |
| `32px` | Header padding (left/right desktop), TimeSlot hover shadow size, depth shadows | Header.css:2, TimeSlot.css:34, BookingPanel.css:20, BookingPopup.css:35 |

**Spacing Scale Pattern:** Roughly follows 4px base unit (4, 8, 12, 16, 20, 24, 28, 32) with occasional 2px, 6px, 10px, 14px, 18px for fine-tuning.

---

## Timing Tokens

### CSS Custom Property Transitions

| Token | Value | Usage | Source |
|-------|-------|-------|--------|
| `--transition-fast` | `150ms ease-out` | Button hovers, slot state changes, text color transitions, border changes | index.css:61 |
| `--transition-medium` | `300ms ease-out` | Panel slide-in, content transitions, larger state changes | index.css:62 |

**Usage Pattern:**
- **Fast (150ms):** Quick feedback for hovers, clicks, color changes
- **Medium (300ms):** Larger movements (panel sliding, popup appearing)

**Applied To (via var()):**
- TimeSlot: all transitions — TimeSlot.css:13
- Header buttons: all transitions — Header.css:52, 89, 120
- BookingPanel: transform transition — BookingPanel.css:18
- BookingBlock: all transitions — BookingBlock.css:12
- Various buttons and interactive elements

---

### Animation Durations (Keyframe Animations)

| Animation Name | Duration | Easing | Usage | Source |
|----------------|----------|--------|-------|--------|
| `pulse-glow` | `2s` | `ease-in-out` | Book Now button pulsing glow (infinite loop) | Header.css:57-64 |
| `glowPulse` | `0.6s` | `ease-out` | Slot confirmation pulse when just booked | TimeSlot.css:91-102 |
| `keyboardFocusPulse` | `1.5s` | `ease-in-out` | Keyboard-focused slot border pulse (infinite loop) | TimeSlot.css:119-130 |
| `fadeIn` | `0.15s` | `ease-out` | Popup overlay backdrop fade-in | BookingPopup.css:41-47 |
| `popupSlideIn` | `0.2s` | `ease-out` | Popup modal content slide + fade in | BookingPopup.css:50-59 |
| `slideIn` (panel) | `0.3s` | `ease-out` | BookingPanel content sections staggered slide-in | BookingPanel.css:156-177 |
| `slideInDay` | `0.4s` | `ease-out` | Week view day columns slide-in (staggered) | WeekView.css:53-62 |

**Staggered Animations:**
- Panel sections: 0ms, 50ms, 100ms delays (BookingPanel.css:160-165)
- Week columns: Uses inline `--delay` CSS variable per column (WeekView.css:50)

---

## Border Radius Values

All distinct border-radius values used across components:

| Value | Usage | Source |
|-------|-------|--------|
| `2px` | Title underline gradient bar | Header.css:31 |
| `4px` | Scrollbar thumb | index.css:132 |
| `5px` | Week view slots (compact radius) | WeekView.css:136 |
| `6px` | Kbd elements (hotkey indicators) | Header.css:240 |
| `8px` | Buttons (Book Now, toggles), time slots (day view), column headers (week view) | Header.css:48, 85, 116, TimeSlot.css:11, WeekView.css:96 |
| `10px` | Booking blocks | BookingBlock.css:5 |
| `12px` | Nav buttons, option buttons, panel section backgrounds, cancel/done/delete buttons, hints bar, current day bg (week view) | Header.css:155, BookingPanel.css:76, 129, 171, Header.css:207, WeekView.css:74 |
| `16px` | TimeStrip container (day view), week-grid container, booking popup | TimeStrip.css:10, WeekView.css:17, BookingPopup.css:28 |

**Border Radius Strategy:**
- **Small (2-6px):** Subtle rounding for small elements (scrollbar, kbd, underline)
- **Medium (8-10px):** Standard UI elements (buttons, slots, blocks)
- **Large (12-16px):** Container elements (panels, popups, major layout regions)

---

## Box Shadow Patterns

### Glow Shadows (Cyan Accent)

**Subtle Glow (Available Slot Default):**
```css
box-shadow: 0 0 8px rgba(0, 229, 229, 0.3);
```
**Source:** TimeSlot.css:25

**Medium Glow (Available Slot Hover):**
```css
box-shadow: 0 0 16px rgba(0, 229, 229, 0.5), 0 0 32px rgba(0, 229, 229, 0.2);
```
**Source:** TimeSlot.css:33-34

**Intense Glow (Selected Slot):**
```css
box-shadow:
  0 0 20px rgba(0, 229, 229, 0.6),
  0 0 40px rgba(0, 229, 229, 0.3),
  0 0 60px rgba(0, 229, 229, 0.15);
```
**Source:** TimeSlot.css:45-47

**Pattern:** Multiple layers of same-color shadow at increasing sizes and decreasing opacity create diffuse glow effect.

---

### Glass Container Shadows

**TimeStrip (Day View Container):**
```css
box-shadow:
  0 0 40px rgba(0, 229, 229, 0.08),
  0 8px 32px rgba(0, 0, 0, 0.5),
  inset 0 1px 0 rgba(255, 255, 255, 0.03);
```
**Source:** TimeStrip.css:12-15

**Components:**
- Cyan glow (40px at 8% opacity): Subtle ambient light
- Depth shadow (8px down, 32px blur, 50% black): Elevates container
- Inset highlight (1px top, 3% white): Simulates glass reflection

---

### Button Shadows

**Book Now Button (Default with Animation):**
```css
box-shadow: 0 0 16px var(--accent-glow-strong), inset 0 0 12px rgba(255, 255, 255, 0.1);
```
**Source:** Header.css:53

**Book Now Button (Hover):**
```css
box-shadow: 0 0 28px var(--accent-glow-strong), 0 0 40px var(--accent-glow);
```
**Source:** Header.css:69

**Nav Button (Hover):**
```css
box-shadow: 0 0 24px var(--accent-glow-strong), 0 6px 16px rgba(0, 0, 0, 0.4);
```
**Source:** Header.css:166

**Pattern:** Buttons combine cyan glow (shows accent color) with depth shadow (black underneath).

---

### Panel/Popup Shadows

**BookingPanel:**
```css
box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
```
**Source:** BookingPanel.css:20
**Purpose:** Shadow to left creates depth as panel slides in from right.

**BookingPopup:**
```css
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.4),
  0 0 60px var(--accent-glow),
  inset 0 1px 0 rgba(255, 255, 255, 0.05);
```
**Source:** BookingPopup.css:34-37

**Components:**
- Depth shadow (8px down, 40% black): Elevates popup
- Cyan glow (60px diffuse): Accent lighting
- Inset highlight (1px top, 5% white): Glass reflection

---

### User Booking Block Shadows

**Default State:**
```css
box-shadow:
  0 0 8px rgba(var(--user-N-rgb), 0.3),
  inset 0 0 12px rgba(var(--user-N-rgb), 0.05);
```
**Source:** BookingBlock.css:21-23 (example for user-1, pattern repeats for all 6)

**Hover State:**
```css
box-shadow:
  0 0 16px rgba(var(--user-N-rgb), 0.5),
  0 0 32px rgba(var(--user-N-rgb), 0.2),
  inset 0 0 20px rgba(var(--user-N-rgb), 0.08);
```
**Source:** BookingBlock.css:35-37

**Pattern:** Uses user's specific color (via --user-N-rgb) for glow instead of cyan. Creates color-coded glow per user.

---

### Focus Outline Shadows

**Keyboard Focus Ring (Time Slot):**
```css
box-shadow:
  0 0 0 3px rgba(251, 191, 36, 0.3),
  0 0 16px rgba(251, 191, 36, 0.4);
```
**Source:** TimeSlot.css:109-110

**Pattern:** Gold/amber color distinguishes keyboard focus from mouse selection (which uses cyan).

---

## Additional Visual Patterns

### Inset Highlights (Glass Reflection)

Multiple components use subtle inset highlights to simulate light reflecting off glass:

```css
inset 0 1px 0 rgba(255, 255, 255, 0.03-0.05)
```

**Used In:**
- TimeStrip container (0.03) — TimeStrip.css:15
- Booking popup (0.05) — BookingPopup.css:37
- Book Now button (0.1 for stronger effect) — Header.css:53

**Effect:** Creates subtle bright edge at top of element, enhancing glass/glossy appearance.

---

### Backdrop Filters

Applied to glass morphism elements:

| Blur Amount | Usage | Source |
|-------------|-------|--------|
| `blur(4px)` | Popup overlay backdrop (subtle background blur) | BookingPopup.css:8 |
| `blur(12px)` | Hints bar (light glass effect) | Header.css:205 |
| `blur(16px)` | Week view grid (medium glass) | WeekView.css:14 |
| `blur(20px)` | TimeStrip, BookingPanel, BookingPopup (strong glass) | TimeStrip.css:8, BookingPanel.css:10, BookingPopup.css:25 |

**Pattern:** Stronger blur (20px) for major UI panels, lighter blur (4-16px) for overlays and smaller containers.

**Browser Compatibility:** Requires `-webkit-backdrop-filter` prefix for Safari support. Modern Chrome/Edge support standard `backdrop-filter`.

---

### Transform Effects

**Hover Transforms:**
- Book Now button: `scale(1.05)` — Header.css:68
- Nav buttons: `scale(1.08)` — Header.css:165
- Option buttons: `translateX(4px)` — BookingPanel.css:84
- Available slots: `translateY(-1px)` — TimeSlot.css:36
- Booking blocks: `translateY(-1px)` — BookingBlock.css:39

**Active (Click) Transform:**
- Nav buttons: `scale(0.98)` — Header.css:170

**Popup Centering Transform:**
```css
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
```
**Source:** BookingPopup.css:16-18

---

### Opacity Values

| Value | Usage | Source |
|-------|-------|--------|
| `0.35` | Past slot opacity, disabled option buttons | TimeSlot.css:61, BookingPanel.css:100 |
| `0.08` | Available slot hover background, current day column bg | TimeSlot.css:30, WeekView.css:73 |
| `0.15` | Selected slot background, booking blocks default | TimeSlot.css:41, WeekView.css:153 |
| `0.8` | Option key opacity, book now .mono opacity | BookingPanel.css:107, Header.css:74 |
| `0.9` | Time label default color (rgba alpha) | TimeSlot.css:71 |
| `1` (full) | Booking block cancel hint on hover (from 0) | BookingBlock.css:241 |

---

### Pointer Events

**BookingOverlay Pattern:**
```css
.booking-overlay {
  pointer-events: none;
}
.booking-overlay .booking-block {
  pointer-events: auto;
}
```
**Source:** BookingOverlay.css:7, 11-12

**Purpose:** Overlay container is click-through, but booking blocks within it are clickable. Allows clicking empty slots below overlay while still interacting with bookings.

**Occupied Slots:**
```css
.time-slot.occupied {
  pointer-events: none;
}
```
**Source:** TimeSlot.css:56

**Purpose:** Occupied slots are non-interactive; clicks go to booking block overlay instead.

---

### Visibility vs Display

**Hidden Time Labels (Occupied Slots):**
```css
.time-slot.occupied .time-label {
  visibility: hidden;
}
```
**Source:** TimeSlot.css:86-88

**Pattern:** Uses `visibility: hidden` (not `display: none`) to maintain layout space while hiding content. Booking block overlay will show time instead.

---

## Responsive Design Token Changes

### Mobile Breakpoint (max-width: 600px)

**Font Size Adjustments:**
- Timezone toggle: `0.9rem` → `0.8rem` (Header.css:271)
- Booking block info: `0.875rem` → `0.8rem` (BookingBlock.css:250)
- Booking block cancel hint: `0.75rem` → `0.7rem` (BookingBlock.css:254)

**Padding Adjustments:**
- Header: `16px 32px` → `16px` (Header.css:253)
- Timezone toggle: `10px 20px` → `8px 12px` (Header.css:270)
- TimeStrip: `12px` → `16px` (TimeStrip.css:29)
- Booking block: `12px 20px` → `10px 16px` (BookingBlock.css:246)

**Hidden Elements:**
- header-hints: `display: none` (Header.css:262)
- week-toggle: `display: none` (Header.css:266)

### Tablet Breakpoint (max-width: 768px)

**Week View Adjustments:**
- Grid columns: `70px repeat(7, 1fr)` → `60px repeat(7, 1fr)` (WeekView.css:180)
- Time cell font: `0.7rem` → `0.65rem` (WeekView.css:185)
- Time cell height: `30px` → `28px` (WeekView.css:186)
- Day name font: `0.7rem` → `0.6rem` (WeekView.css:194)
- Day date font: `1.1rem` → `0.9rem` (WeekView.css:198)
- Week slot height: `30px` → `28px` (WeekView.css:202)

**Panel Width:**
- BookingPanel: `340px` → `100%` (BookingPanel.css:149)
- BookingPopup: `340px` → `calc(100vw - 32px)` (BookingPopup.css:247)

---

## Technology-Neutral Usage Notes

**For Rails Implementation:**

1. **CSS Custom Properties:** Define these in a `variables.css` or at top of main stylesheet
2. **RGB Values:** Use the `-rgb` tokens with `rgba()` for transparency effects
3. **Backdrop Filter:** Provide fallback for older browsers (e.g., solid background at higher opacity)
4. **Font Loading:** Ensure web fonts (DM Sans, JetBrains Mono) loaded via `@font-face` or CDN
5. **Keyframe Animations:** Copy keyframe definitions directly; CSS animations are framework-agnostic

**Color Application Pattern:**
```css
/* Example: User booking block */
background: rgba(var(--user-1-rgb), 0.35);
border: 1px solid rgba(var(--user-1-rgb), 0.6);
color: var(--user-1-color);
```

**Glass Morphism Pattern:**
```css
background: var(--glass-bg);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid var(--glass-border);
```

---

## Cross-References to Phase 6 Code

**All color values extracted from:**
- `index.css:1-63` — CSS custom properties in :root
- `TimeSlot.css:106` — Keyboard focus color
- `BookingPanel.css:138` — Delete hover color
- `BookingPopup.css:7, 201` — Popup overlay, delete button colors
- `WeekView.css:72-76` — Current day column background

**All typography values extracted from:**
- `index.css:72, 89-91` — Font families
- All component CSS files: Header.css, TimeSlot.css, BookingPanel.css, BookingPopup.css, WeekView.css, BookingBlock.css — Font sizes, weights, letter-spacing

**All spacing values extracted from:**
- All component CSS files — Padding, margin, gap values

**All timing values extracted from:**
- `index.css:61-62` — Transition tokens
- `Header.css:57-64` — pulse-glow animation
- `TimeSlot.css:91-130` — glowPulse, keyboardFocusPulse animations
- `BookingPanel.css:156-177` — slideIn animation
- `BookingPopup.css:41-59` — fadeIn, popupSlideIn animations
- `WeekView.css:53-62` — slideInDay animation

**All shadow patterns extracted from:**
- `TimeSlot.css:25-47` — Slot glow shadows
- `TimeStrip.css:12-15` — Container depth shadows
- `Header.css:53, 69, 160, 166` — Button shadows
- `BookingPanel.css:20` — Panel shadow
- `BookingPopup.css:34-37` — Popup shadow
- `BookingBlock.css:21-37` — User block shadows

---

**Document Complete:** 100% design token extraction. Rails developer has every color (hex + RGB), typography setting, spacing value, timing function, border radius, and shadow pattern needed to recreate the visual design.
