# Design System Reference

*Use this guide to apply consistent styling across your application*

---

## Base Styles

Apply these to your root element to establish the foundation:

```css
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #0d1a2d 0%, #08101C 70%);
  color: #FFFFFF;
  font-family: 'JetBrains Mono', 'Roboto Mono', 'Fira Code', monospace;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.5px;
}
```

---

## CSS Variables (Copy This Block)

```css
:root {
  /* Colors */
  --color-bg-body: #08101C;
  --color-bg-gradient: radial-gradient(ellipse at center, #0d1a2d 0%, #08101C 70%);
  --color-bg-surface: #0B1626;
  --color-primary: #00F0FF;
  --color-primary-dim: rgba(0, 240, 255, 0.3);
  --color-primary-glow: rgba(0, 240, 255, 0.5);
  --color-text-main: #FFFFFF;
  --color-text-muted: rgba(255, 255, 255, 0.5);
  --color-text-inverse: #050910;
  --color-border: rgba(0, 240, 255, 0.15);

  /* Typography */
  --font-family: 'JetBrains Mono', 'Roboto Mono', 'Fira Code', monospace;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --letter-spacing: 0.5px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Sizing */
  --button-height: 40px;
  --button-height-lg: 48px;
  --icon-button-size: 40px;
  --container-max-width: 480px;
  --header-height: 60px;

  /* Borders */
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 20px;
  --border-width: 1px;

  /* Effects */
  --shadow-glow: 0 0 10px var(--color-primary-glow);
  --shadow-glow-strong: 0 0 15px rgba(0, 240, 255, 0.8);
  --shadow-glow-subtle: 0 0 6px rgba(0, 240, 255, 0.3);
  --transition-fast: 0.15s ease-out;
  --transition-normal: 0.2s ease-out;
}
```

---

## Page Layout

### Header
```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.brand-title {
  font-size: var(--font-size-xl);
  font-weight: 500;
  line-height: var(--line-height-tight);
  padding-bottom: var(--spacing-xs);
  border-bottom: 2px solid var(--color-primary);
  text-shadow: 0 0 20px var(--color-primary-glow);
}
```

### Main Content Area
```css
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-lg);
}
```

### Content Container (Card)
```css
.card {
  background: transparent;
  border: 1px solid var(--color-primary-dim);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  max-width: var(--container-max-width);
  width: 100%;
}
```

---

## Interactive Components

### Primary Button (Filled with glow)
Use for main actions, navigation arrows, submit buttons.

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--icon-button-size);
  height: var(--button-height);
  padding: 0 var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-glow);
}

.btn-primary:hover {
  box-shadow: var(--shadow-glow-strong);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-glow-subtle);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn-primary:disabled {
  background: rgba(0, 240, 255, 0.2);
  color: var(--color-text-muted);
  box-shadow: none;
  cursor: not-allowed;
}
```

### Secondary Button (Outlined)
Use for list items, selectable options, less prominent actions.

```css
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--button-height);
  padding: 0 var(--spacing-md);
  background: transparent;
  color: var(--color-text-main);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  box-shadow: var(--shadow-glow);
  background: rgba(0, 240, 255, 0.05);
}

.btn-secondary:active,
.btn-secondary.selected {
  background: rgba(0, 240, 255, 0.15);
  box-shadow: var(--shadow-glow), inset 0 0 10px rgba(0, 240, 255, 0.1);
}

.btn-secondary:focus-visible {
  outline: none;
  box-shadow: var(--shadow-glow-strong);
}

.btn-secondary:disabled {
  border-color: var(--color-primary-dim);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
```

### Tertiary Button (Ghost with keyboard hint)
Use for header actions, secondary navigation. Include keyboard shortcut in brackets.

```css
.btn-tertiary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  color: var(--color-text-main);
  border: 1px solid var(--color-primary-dim);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-tertiary:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow-subtle);
}

/* Keyboard shortcut hint - render as: [W] Week View */
.kbd-hint {
  opacity: 0.7;
}
```

### Icon Button (Square, for arrows)
```css
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-button-size);
  height: var(--icon-button-size);
  padding: 0;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-glow);
}

/* Use ← and → characters or SVG arrows */
```

---

## List/Stack Layout

For vertical lists of selectable items:

```css
.list-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

.list-item {
  /* Uses .btn-secondary styles above */
}
```

---

## Navigation Row

For date pickers, pagination, or any prev/next controls:

```css
.nav-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.nav-row .label {
  font-size: var(--font-size-lg);
  font-weight: 500;
  min-width: 280px;
  text-align: center;
}
```

---

## Custom Scrollbar

Apply to scrollable containers:

```css
.scrollable {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary) transparent;
}

.scrollable::-webkit-scrollbar {
  width: 6px;
}

.scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.scrollable::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 3px;
}

.scrollable::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
  box-shadow: var(--shadow-glow-subtle);
}
```

---

## Form Inputs

```css
input, textarea, select {
  width: 100%;
  height: var(--button-height);
  padding: 0 var(--spacing-md);
  background: transparent;
  color: var(--color-text-main);
  border: 1px solid var(--color-primary-dim);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

input:hover, textarea:hover, select:hover {
  border-color: var(--color-primary);
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}

input::placeholder {
  color: var(--color-text-muted);
}

input:disabled {
  border-color: var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
```

---

## Utility Classes

```css
/* Text */
.text-center { text-align: center; }
.text-muted { color: var(--color-text-muted); }
.text-primary { color: var(--color-primary); }

/* Glow effect for any element */
.glow { box-shadow: var(--shadow-glow); }
.glow-strong { box-shadow: var(--shadow-glow-strong); }
.glow-text { text-shadow: 0 0 10px var(--color-primary-glow); }

/* Spacing helpers */
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }
.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }
```

---

## Design Principles Summary

1. **Dark base + single accent color** - Deep navy background with neon cyan as the only accent
2. **Glow, not shadow** - Elements emit light rather than cast shadows
3. **Monospace everywhere** - Reinforces the technical/developer aesthetic
4. **Generous whitespace** - Let elements breathe, focus attention on content
5. **Subtle hover states** - Add glow on hover, slight background tint on active
6. **Keyboard-first hints** - Show shortcuts with `[K]` bracket notation
7. **Transparent containers** - Cards/containers use borders, not filled backgrounds
