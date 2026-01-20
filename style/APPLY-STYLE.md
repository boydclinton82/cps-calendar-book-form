# Design Application Instructions

You are tasked with applying a specific visual design to an existing application. The application is fully functional and structurally complete - your job is purely aesthetic.

> **IMPORTANT:** The design system in this folder is the source of truth. Do not deviate from these colors, fonts, or visual patterns - they have been carefully extracted from reference images. Apply your expertise to execution quality (spacing, alignment, transitions, polish), not creative direction. This is about faithful implementation, not reinterpretation.

---

## Reference Materials

Before making any changes, study these files thoroughly:

1. **`style/1.png`** - Day view reference (single column layout)
2. **`style/2.png`** - Week view reference (grid/calendar layout)
3. **`style/1-analysis.md`** - Complete design system with CSS variables and component styles

---

## Your Mission

Transform the visual appearance of this application to match the cyberpunk/neon aesthetic shown in the reference images. The design is characterised by:

- Deep navy background with subtle radial gradient
- Neon cyan (`#00F0FF`) as the single accent color
- Monospace typography throughout
- Glowing borders and buttons (box-shadow, not traditional shadows)
- Transparent containers with subtle cyan borders
- High contrast, clean, futuristic feel

---

## Rules

### DO NOT Change:
- Application functionality or logic
- Component hierarchy or parent-child relationships
- Data flow or state management
- Route structure
- Core HTML/JSX element structure
- Event handlers or business logic
- API calls or data fetching

### YOU MAY Adjust:
- Colors, fonts, spacing, sizing
- Border radii, shadows, transitions
- Flexbox/grid alignment and justification
- Padding and margins
- Visual element ordering (if it improves the design)
- Adding wrapper elements for styling purposes
- Adding CSS classes
- Hover/focus/active states
- Responsive breakpoints

### YOU SHOULD:
- Apply the CSS variables from `1-analysis.md` to the project's root styles
- Use the component patterns provided (buttons, cards, inputs, etc.)
- Match the glow effects, especially on interactive elements
- Ensure all interactive elements have proper hover/focus states
- Make professional judgement calls on alignment and visual balance
- Ensure the design looks polished and intentional, not just "reskinned"

---

## Implementation Approach

### Step 1: Establish Foundation
Copy the CSS variables block from `1-analysis.md` into the project's global CSS file. Apply the base styles to `html, body`:

```css
background: radial-gradient(ellipse at center, #0d1a2d 0%, #08101C 70%);
color: #FFFFFF;
font-family: 'JetBrains Mono', 'Roboto Mono', 'Fira Code', monospace;
```

### Step 2: Analyse Existing Components
Read through the application's component files. For each component, identify:
- What type of element is it? (button, card, list, input, header, etc.)
- What is its equivalent in the reference images?
- Which styles from `1-analysis.md` apply?

### Step 3: Apply Styles Systematically
Work through components one at a time:
1. Apply the relevant component styles from the design system
2. Adjust spacing/alignment to match the reference aesthetic
3. Add hover/focus/active states
4. Verify it looks correct before moving on

### Step 4: Polish and Refine
- Check visual consistency across all views
- Ensure glow effects are present on interactive elements
- Verify the design feels cohesive and professional
- Make any final alignment adjustments

---

## Key Visual Elements to Match

### From Reference Image 1 (Day View):
- Header with glowing underline on brand text
- Header separated from content by subtle border
- Tertiary button with `[K]` keyboard hint notation
- Navigation row with solid cyan arrow buttons flanking centered text
- Vertical list of outlined buttons with hover glow
- Large rounded container with dim cyan border
- Custom scrollbar styling

### From Reference Image 2 (Week View):
- Grid layout with time labels on left
- Day columns with abbreviated day names and date numbers
- Highlighted current day column (slightly different background)
- Horizontal time slot rows spanning full width
- Same header pattern as day view
- Same navigation pattern as day view

### Universal Elements:
- Deep navy background with subtle gradient (lighter in center)
- All text in monospace
- Cyan borders on containers (low opacity ~0.15-0.3)
- Cyan borders on buttons (full opacity)
- Glow effects via box-shadow, not drop-shadow
- No filled backgrounds on containers (transparent)
- Generous whitespace around central content

---

## Quality Checklist

Before considering the task complete, verify:

- [ ] Background has the radial gradient (not flat color)
- [ ] All text uses monospace font
- [ ] Primary buttons have cyan fill with glow
- [ ] Secondary/outlined buttons have glow on hover
- [ ] Containers use transparent background with dim cyan border
- [ ] Header brand text has glowing underline
- [ ] Interactive elements have visible focus states
- [ ] Disabled states use muted colors
- [ ] Custom scrollbar matches the design (if scrolling exists)
- [ ] Overall feel matches the "cyberpunk/developer tool" aesthetic
- [ ] No jarring visual inconsistencies

---

## Example Transformations

**Generic button → Styled button:**
```css
/* Before */
.button { background: blue; color: white; }

/* After */
.button {
  background: transparent;
  color: var(--color-text-main);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family);
  transition: all var(--transition-fast);
}
.button:hover {
  box-shadow: var(--shadow-glow);
}
```

**Generic container → Styled card:**
```css
/* Before */
.container { background: #f0f0f0; border-radius: 8px; }

/* After */
.container {
  background: transparent;
  border: 1px solid var(--color-primary-dim);
  border-radius: var(--border-radius-lg);
}
```

---

## Final Notes

- Trust the design system - it's been carefully extracted from the reference images
- When in doubt, reference the PNG files directly
- The goal is a polished, professional result that looks intentionally designed
- Small details matter: consistent spacing, aligned elements, smooth transitions
- The aesthetic is "high-tech developer tool" - precise, clean, futuristic
