# UI Layout Structure

**Document Purpose:** Complete spatial hierarchy of the BMO Financial booking form interface. Maps every layout region, containment relationship, positioning strategy, and z-index layer for Rails recreation.

**Visual Truth Sources:** Phase 5 screenshots (`.planning/phases/05-visual-capture/screenshots/`)
**Implementation Truth Sources:** Phase 6 extracted CSS (`.planning/phases/06-code-extraction/extracted-code/src/`)

---

## Page Layout Overview

**Root Container:** `#root`
- **Positioning:** `display: flex`, `flex-direction: column`
- **Dimensions:** `min-height: 100vh` (full viewport height)
- **Background:** `linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)`
- **Background Attachment:** `fixed` (gradient doesn't scroll)
- **Source:** index.css:73-74, 82-86

**Full-page structure:** Vertical flex column layout with header at top, calendar/week view in center, fixed panels overlaying from sides/center.

**Screenshot:** 01-initial-states/000-initial-load.png (shows full page gradient and layout)

---

## Component Hierarchy Tree

Complete containment tree showing what components are inside what:

```
App (root flex column)
├── Header (transparent, padding: 16px 32px)
│   ├── header-top (flex row, space-between)
│   │   ├── header-title (1.5rem, glowing underline)
│   │   └── header-actions (flex row, gap: 12px)
│   │       ├── book-now-btn (conditional: visible when current hour available)
│   │       ├── week-toggle [W] (switches between day/week view)
│   │       └── timezone-toggle [T] (QLD/NSW timezone switch)
│   ├── header-nav (flex row, centered, gap: 28px)
│   │   ├── nav-btn (previous, 48px × 48px circular)
│   │   ├── header-date (flex column, centered)
│   │   │   ├── date-text (1.25rem)
│   │   │   └── today-badge (0.8rem, uppercase, cyan)
│   │   └── nav-btn (next, 48px × 48px circular)
│   └── header-hints (glass bar with keyboard shortcuts)
│       └── hint (×8, each with kbd element)
│
├── TimeStrip (day view, visible when week view OFF)
│   └── slots-container (relative positioned, gap: 6px)
│       ├── TimeSlot (×16, one per hour from 6AM-10PM)
│       │   └── time-label (0.875rem monospace)
│       └── BookingOverlay (absolute, full container)
│           └── BookingBlock (×N, one per booking, absolute positioned)
│               ├── booking-block-info (user name + time, 0.875rem mono)
│               └── booking-block-cancel-hint (bottom hint, 0.75rem)
│
├── WeekView (week view, visible when week view ON)
│   └── week-grid (8-column grid: 70px + 7×1fr, gap: 4px)
│       ├── time-column (left, 70px wide)
│       │   ├── column-header (50px height, empty placeholder)
│       │   └── time-cell (×16, 30px height each, 0.7rem)
│       └── day-column (×7, one per day)
│           ├── column-header (50px height, clickable)
│           │   ├── day-name (0.7rem, uppercase, "SUN", "MON", etc.)
│           │   └── day-date (1.1rem, numeric date)
│           └── slots-container (relative positioned)
│               ├── week-slot (×16, 30px height, 5px radius)
│               └── BookingOverlay (absolute, full container)
│                   └── BookingBlock (×N, absolute positioned)
│
├── BookingPanel (fixed, right: 0, slides in from right)
│   ├── panel-header (flex column, gap: 8px, bottom border)
│   │   ├── panel-title (1.2rem, "Book a time")
│   │   └── panel-time (1.75rem monospace, "7:00 AM")
│   ├── panel-section (WHO section, gap: 14px)
│   │   ├── section-title (0.8rem, uppercase, "WHO")
│   │   └── option-group (flex column, gap: 10px)
│   │       └── option-btn (×N, one per user, with hotkey)
│   │           ├── option-key (0.75rem, "[J]", "[A]", etc.)
│   │           └── option-label (1rem, user name)
│   ├── panel-section (DURATION section, gap: 14px)
│   │   ├── section-title (0.8rem, uppercase, "DURATION")
│   │   └── option-group (flex column, gap: 10px)
│   │       └── option-btn (×3, for 1hr/2hr/3hr, with hotkeys)
│   │           ├── option-key (0.75rem, "[1]", "[2]", "[3]")
│   │           └── option-label (1rem, "1 hour", "2 hours", "3 hours")
│   └── cancel-btn (transparent, bottom border, "Cancel [Esc]")
│
└── BookingPopup (fixed, centered, modal overlay)
    ├── popup-overlay (full viewport, rgba(0,0,0,0.6) backdrop)
    └── booking-popup (340px × auto, centered, glass effect)
        ├── popup-header (flex column, gap: 8px, bottom border)
        │   ├── popup-title (1.2rem, "Edit booking")
        │   └── popup-time (1.75rem monospace, "7:00 AM - 9:00 AM")
        ├── popup-section (WHO section, gap: 14px)
        │   ├── section-title (0.8rem, uppercase, "WHO")
        │   └── option-group (flex column, gap: 10px)
        │       └── option-btn (×N, one per user)
        ├── popup-section (DURATION section, gap: 14px)
        │   ├── section-title (0.8rem, uppercase, "DURATION")
        │   └── option-group (flex column, gap: 10px)
        │       └── option-btn (×3, for 1hr/2hr/3hr)
        └── popup-actions (flex column, gap: 10px)
            ├── done-btn (cyan bg, "Done [Enter]", 0.7rem key)
            ├── delete-btn (red accent, "Delete [D]", 0.7rem key)
            └── close-btn (transparent, "Close [Esc]", 0.7rem key)
```

**Key containment principles:**
- **TimeStrip/WeekView:** Only one visible at a time (toggled by [W] key)
- **BookingPanel:** Slides in when slot selected, fixed to right edge
- **BookingPopup:** Appears centered when existing booking clicked, with full-page backdrop
- **BookingOverlay:** Positioned absolutely within slots-container, allows booking blocks to overlay slots

---

## Layout Regions

### Region 1: Header (Top, Transparent Background)

**Positioning:** Static flow (top of flex column)
**Dimensions:**
- Padding: `16px 32px` (desktop), `16px` (mobile)
- Height: Auto (approximately 200px with all sections visible)

**Internal Structure:**
- **header-top:** Horizontal flex row, `justify-content: space-between`, `margin-bottom: 16px`
- **header-title:** Left-aligned, with gradient underline (3px height, 12px glow)
- **header-actions:** Right-aligned, 3 buttons in horizontal row, `gap: 12px`
- **header-nav:** Centered, prev/next buttons (48px × 48px), date display between them, `gap: 28px`
- **header-hints:** Glass bar with keyboard shortcuts, `padding: 14px 24px`, cyan left border (4px with glow)

**Responsive Behavior (Mobile, max-width: 600px):**
- header-top: Changes to `flex-direction: column`, `gap: 12px`
- header-hints: Hidden (`display: none`)
- week-toggle: Hidden (`display: none`)

**Screenshot:** 01-initial-states/000-initial-load.png (full header with all sections)
**Source:** Header.css:1-274

---

### Region 2: Calendar Grid (Day View, Centered)

**Positioning:** Centered in viewport (margin auto)
**Dimensions:**
- Width: `360px` (fixed, centered)
- Padding: `12px` (internal)
- Gap between slots: `6px`

**TimeStrip Container:**
- **Background:** `rgba(10, 20, 35, 0.85)` (darker glass)
- **Backdrop Filter:** `blur(20px)` (glass morphism)
- **Border:** `1px solid rgba(0, 229, 229, 0.25)` (subtle cyan)
- **Border Radius:** `16px`
- **Box Shadow:** Cyan glow + depth shadow (0 0 40px cyan, 0 8px 32px black)

**Slots Container (Internal):**
- **Positioning:** `relative` (enables absolute overlay)
- **Layout:** Vertical flex column, `gap: 6px`
- **Children:** 16 TimeSlot components (6AM-10PM, one per hour)

**TimeSlot Dimensions:**
- Width: `100%` (fills 360px container minus padding)
- Height: `36px` (fixed)
- Padding: `0 20px` (horizontal only)

**Overlay System:**
- **BookingOverlay:** `position: absolute`, `inset: 0` (covers entire slots-container), `pointer-events: none`
- **BookingBlock (children):** `position: absolute`, `pointer-events: auto`, spans multiple slot heights based on duration

**Screenshot:** 01-initial-states/001-empty-calendar-full-day.png (centered TimeStrip with 16 slots)
**Source:** TimeStrip.css:1-34, TimeSlot.css:1-16, BookingOverlay.css:1-14

---

### Region 3: Calendar Grid (Week View, Full Width)

**Positioning:** Full viewport width, centered
**Dimensions:**
- Week grid: 8 columns (70px time column + 7×1fr day columns)
- Gap: `4px` between all cells
- Padding: `12px` (internal)

**Week Grid Container:**
- **Display:** `grid`
- **Grid Template:** `grid-template-columns: 70px repeat(7, 1fr)`
- **Background:** `rgba(15, 29, 50, 0.6)` (glass)
- **Backdrop Filter:** `blur(16px)`
- **Border:** `1px solid rgba(0, 229, 229, 0.2)`
- **Border Radius:** `16px`
- **Box Shadow:** Cyan glow + depth shadow

**Time Column (Left, 70px):**
- **Column Header:** 50px height, empty placeholder (transparent)
- **Time Cells:** 16 rows, 30px height each, `0.7rem` font, right-aligned

**Day Columns (7×):**
- **Column Header:** 50px height, flex column (day name + date), `8px` border-radius
- **Slots Container:** Relative positioned, 16 week-slot elements
- **Week Slot:** 30px height, `5px` border-radius (smaller than day view)

**Current Day Highlight:**
- **Pseudo-element:** `::before` with `inset: -6px`, cyan background at 8% opacity, `12px` border-radius
- **Effect:** Subtle glow behind entire day column

**Screenshot:** Week view visible in navigation (week-toggle active)
**Source:** WeekView.css:1-205

---

### Region 4: Booking Panel (Fixed Right Side)

**Positioning:** `position: fixed`, `right: 0`, `top: 0`
**Dimensions:**
- Width: `340px` (desktop), `100%` (mobile)
- Height: `100vh` (full viewport height)
- Padding: `28px` (internal)
- Gap: `28px` between sections

**Visual Treatment:**
- **Background:** `rgba(15, 29, 50, 0.6)` (glass)
- **Backdrop Filter:** `blur(20px)` (strong glass morphism)
- **Border:** `1px solid rgba(0, 229, 229, 0.2)` (left border only)
- **Box Shadow:** `-8px 0 32px rgba(0, 0, 0, 0.4)` (depth shadow to left)

**Slide-In Animation:**
- **Closed State:** `transform: translateX(100%)` (offscreen to right)
- **Open State:** `transform: translateX(0)` (slides into view)
- **Transition:** `300ms ease-out`

**Z-Index:** `100` (above calendar, below popup)

**Internal Layout:**
- Vertical flex column, `gap: 28px`
- panel-header at top (time display, large monospace)
- panel-section (WHO) with user buttons
- panel-section (DURATION) with duration buttons (disabled until user selected)
- cancel-btn at bottom with `margin-top: auto` (pushes to bottom)

**Content Animation:**
- Staggered slide-in for each panel-section (0ms, 50ms, 100ms delays)
- Animation: opacity 0→1, translateX(20px)→0, `0.3s ease-out`

**Screenshot:** 01-initial-states/002-date-selected-with-panel.png (panel open after slot selection)
**Source:** BookingPanel.css:1-178

---

### Region 5: Popup Overlay (Fixed Centered Modal)

**Positioning:** `position: fixed`, centered with `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`
**Dimensions:**
- Width: `340px` (desktop), `calc(100vw - 32px)` (mobile)
- Height: Auto (based on content)
- Max Height: `calc(100vh - 48px)` (allows scroll if content exceeds viewport)
- Padding: `28px` (internal)
- Gap: `24px` between sections

**Layer Structure:**
1. **popup-overlay (backdrop):**
   - **Positioning:** `position: fixed`, `inset: 0` (full viewport)
   - **Background:** `rgba(0, 0, 0, 0.6)` (60% black)
   - **Backdrop Filter:** `blur(4px)` (blurs calendar behind)
   - **Z-Index:** `200` (above panel)

2. **booking-popup (modal content):**
   - **Positioning:** `position: fixed`, centered (as above)
   - **Background:** `rgba(15, 29, 50, 0.6)` (glass)
   - **Backdrop Filter:** `blur(20px)` (strong glass morphism)
   - **Border:** `1px solid rgba(0, 229, 229, 0.2)`, `16px` border-radius
   - **Box Shadow:** Depth + cyan glow (0 8px 32px black, 0 0 60px cyan glow, inset highlight)
   - **Z-Index:** `201` (above backdrop)

**Animations:**
- **Backdrop:** fadeIn (opacity 0→1, 150ms ease-out)
- **Popup Content:** popupSlideIn (opacity 0→1 + translateY(-48%)→(-50%), 200ms ease-out)

**Modal Body Scroll Lock:**
- When popup open: `body.modal-open` applies `overflow: hidden`, `position: fixed`, `width: 100%`
- Prevents background scrolling while modal is open

**Internal Layout:**
- popup-header (time range, large monospace: "7:00 AM - 9:00 AM")
- popup-section (WHO) with user buttons
- popup-section (DURATION) with duration buttons
- popup-actions (3 buttons: Done, Delete, Close)

**Screenshot:** Popup visible when clicking existing booking (edit mode)
**Source:** BookingPopup.css:1-250, index.css:139-144 (body.modal-open)

---

## Day View vs Week View Layouts

### Day View (Default)

**Trigger:** Week toggle inactive, OR [W] key toggles off
**Layout:**
- **Centered TimeStrip:** 360px fixed width, 16 vertical slots (6px gap)
- **Slot Height:** 36px each
- **Total Height:** ~600px (16 slots × 36px + 15 gaps × 6px + 24px padding)

**Slot Interaction:**
- Click available slot → BookingPanel slides in from right
- Click booking block → BookingPopup appears centered

**Screenshot:** 01-initial-states/001-empty-calendar-full-day.png
**Source:** TimeStrip.css:2-16

### Week View (Toggled On)

**Trigger:** Week toggle active, OR [W] key toggles on
**Layout:**
- **Full-width Grid:** 8 columns (70px + 7×1fr), 4px gaps
- **Row Structure:** 1 header row (50px) + 16 time rows (30px each)
- **Slot Height:** 30px (smaller than day view for compactness)
- **Total Height:** ~550px (1 header × 50px + 16 rows × 30px + gaps)

**Column Layout:**
- **Time Column:** Left-aligned, right-justified time labels (0.7rem)
- **Day Columns:** 7 equal-width columns, each with header (day name + date) and 16 slots

**Current Day Indicator:**
- Cyan background at 8% opacity behind entire column (`inset: -6px`, 12px radius)
- Header background: cyan solid with 20px glow

**Slot Interaction:**
- Click available slot in any day → BookingPanel opens (slot selection changes date)
- Click booking block in any day → BookingPopup opens (edit existing)

**Week Grid Animation:**
- Each day column slides in from right with staggered delays (0-300ms)
- Animation: slideInDay (opacity 0→1, translateX(20px)→0, 400ms ease-out)

**Screenshot:** Week view (toggle active state)
**Source:** WeekView.css:8-22, 43-62, 64-76

---

## Overlay System (Bookings Over Slots)

**Problem:** Bookings must visually overlay time slots without disrupting slot layout or preventing slot interaction.

**Solution:** Absolute positioning within a relative container.

### Structure

1. **slots-container:**
   - **Positioning:** `position: relative` (establishes positioning context)
   - **Layout:** `display: flex`, `flex-direction: column`, `gap: 6px` (day) or `4px` (week)
   - **Contains:** All TimeSlot or week-slot elements (normal flow)

2. **BookingOverlay (sibling to slots):**
   - **Positioning:** `position: absolute`, `inset: 0` (covers entire slots-container)
   - **Pointer Events:** `pointer-events: none` (allows clicks through to slots below)

3. **BookingBlock (children of overlay):**
   - **Positioning:** `position: absolute`, `left: 0`, `right: 0`
   - **Top/Height:** Calculated based on start time and duration (spans multiple slot heights)
   - **Pointer Events:** `pointer-events: auto` (clickable despite parent's none)

### Slot State When Occupied

**Occupied Slots (time slots with bookings):**
- **Background:** `transparent` (booking block shows the color)
- **Border:** `transparent` (no slot border visible)
- **Time Label:** `visibility: hidden` (booking block shows the time)
- **Pointer Events:** `pointer-events: none` (clicks go to booking block above)

**Result:** Booking blocks appear to "replace" the slots visually, but slots still maintain layout spacing.

### Booking Block Positioning

**Day View Calculation:**
- Slot height: 36px
- Slot gap: 6px
- First slot (6AM): top: 0
- Second slot (7AM): top: 42px (36px + 6px)
- N-th slot: top = (N - 1) × 42px

**Example:** 7AM booking for 2 hours
- Start: 7AM = index 1 = top: 42px
- Duration: 2 hours = height: 78px (36px + 6px + 36px)

**Week View Calculation:**
- Slot height: 30px
- Slot gap: 4px
- First slot (6AM): top: 0
- Second slot (7AM): top: 34px (30px + 4px)

### Z-Index Layering

| Element | Z-Index | Purpose |
|---------|---------|---------|
| TimeSlot/week-slot | (default, 0) | Background layer |
| BookingOverlay | (default, 1) | Contains blocks |
| BookingBlock | `2` | Overlays slots |
| BookingPanel | `100` | Slides over calendar |
| popup-overlay | `200` | Dims everything |
| booking-popup | `201` | Modal content on top |

**Screenshot:** 02-slot-states/005-multi-hour-booking-block.png (shows booking block spanning multiple slots)
**Source:** BookingOverlay.css:1-14, BookingBlock.css:1-15

---

## Glass Morphism Effects

**Glass morphism** = translucent backgrounds with backdrop blur, creating depth layering.

### Application Locations

**Strong Glass (blur: 20px):**
- TimeStrip container (day view calendar)
- BookingPanel (side panel)
- booking-popup (modal)

**Medium Glass (blur: 16px):**
- week-grid (week view container)

**Subtle Glass (blur: 12px):**
- header-hints (keyboard shortcuts bar)

**Backdrop Blur (blur: 4px):**
- popup-overlay (dims calendar when modal open)

### Glass Recipe

1. **Background:** `rgba(15, 29, 50, 0.6)` or similar (60-70% opacity)
2. **Backdrop Filter:** `blur(Npx)` (blurs content behind)
3. **-webkit-backdrop-filter:** Same (Safari/Chrome support)
4. **Border:** `1px solid rgba(0, 229, 229, 0.2)` (subtle cyan edge)
5. **Box Shadow:** Cyan glow (0 0 40px cyan-glow) + depth shadow (0 8px 32px black)
6. **Inset Highlight:** `inset 0 1px 0 rgba(255, 255, 255, 0.05)` (subtle top edge shine)

**Visual Effect:** Container appears to float above background with frosted glass transparency, subtle cyan accent glow.

**Source:** index.css:57-58 (CSS tokens), TimeStrip.css:7-15, BookingPanel.css:9-11, BookingPopup.css:24-37

---

## Responsive Breakpoints

### Breakpoint 1: Desktop (Default, ≥600px)

**Header:**
- Horizontal layout (title left, actions right)
- All buttons visible (Book Now, Week Toggle, Timezone Toggle)
- Hints bar visible (keyboard shortcuts)
- Padding: 16px 32px

**Calendar:**
- Day view: 360px centered TimeStrip
- Week view: Full-width grid with 70px time column

**Panel:**
- Width: 340px (fixed right side)
- Slides in from right edge

**Popup:**
- Width: 340px (centered)

**Screenshot:** 06-responsive/desktop-full-page.png

### Breakpoint 2: Mobile (max-width: 600px)

**Header:**
- Stacked layout (flex-direction: column)
- Week toggle: Hidden
- Hints bar: Hidden
- Timezone toggle: Smaller padding (8px 12px), smaller font (0.8rem)
- Padding: 16px (reduced from 32px)

**Calendar:**
- Day view: Full width (max-width: 100%), 16px padding
- Week view: Grid columns adjusted to 60px time + 7×1fr days

**Panel:**
- Width: 100% (full-screen overlay)
- Dark backdrop behind panel

**Popup:**
- Width: calc(100vw - 32px) (16px margins)

**Source:** Header.css:251-273, TimeStrip.css:26-33, WeekView.css:174-204, BookingPanel.css:147-152, BookingPopup.css:244-249

**Screenshot:** 06-responsive/mobile-full-page.png, 06-responsive/mobile-with-panel.png

---

## Technology-Neutral Translation Notes

**For Rails Implementation:**

- **Flex/Grid Layouts:** Use CSS Flexbox and Grid (same as React CSS)
- **Fixed Positioning:** BookingPanel and BookingPopup use fixed positioning (works identically in all frameworks)
- **Z-Index Layering:** Apply exact z-index values (100, 200, 201) to maintain stacking order
- **Glass Morphism:** Requires backdrop-filter CSS (supported in modern browsers; provide fallback for older browsers)
- **Animations:** Use CSS transitions and keyframes (no JavaScript required for these animations)
- **Responsive:** Use CSS media queries at 600px and 768px breakpoints

**Component Names are Cross-References:**
- "Header" = Rails partial/component that renders header region
- "TimeStrip" = Rails partial that renders day view calendar
- "WeekView" = Rails partial that renders week view grid
- "BookingPanel" = Rails partial that slides in on slot selection
- "BookingPopup" = Rails partial that appears when editing existing booking

**React-Specific Ignored:**
- Ignore React component state/props (focus on CSS visual output)
- Ignore useEffect/useState hooks (Rails will handle state differently)
- CSS classes are what matter (apply same classes in Rails HTML)

---

## Cross-References to Phase 6 Code

**All measurements, dimensions, and positioning values extracted from:**

- `index.css:1-145` — Root layout, body, #root container
- `Header.css:1-274` — Header region structure and responsive
- `TimeSlot.css:1-131` — Day view slot dimensions and states
- `TimeStrip.css:1-34` — Day view container dimensions
- `WeekView.css:1-205` — Week view grid structure
- `BookingPanel.css:1-178` — Side panel dimensions and slide animation
- `BookingPopup.css:1-250` — Modal popup dimensions and centering
- `BookingBlock.css:1-257` — Booking overlay absolute positioning
- `BookingOverlay.css:1-14` — Overlay pointer-events strategy

**All visual states documented from Phase 5 screenshots:**

- `01-initial-states/` — Header, calendar, panel visibility
- `02-slot-states/` — Slot visual states and booking blocks
- `06-responsive/` — Mobile/tablet/desktop layouts

---

**Document Complete:** 100% layout hierarchy documented. Rails developer knows WHERE everything goes, HOW it's positioned, and WHAT dimensions to use.
