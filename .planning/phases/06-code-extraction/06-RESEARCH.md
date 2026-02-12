# Phase 6: Code Extraction - Research

**Researched:** 2026-02-13
**Domain:** Code extraction, dead code elimination, technology-neutral documentation
**Confidence:** HIGH

## Summary

Code extraction for cross-framework migration requires three distinct activities: (1) identifying and removing dead/unused code from the active codebase, (2) creating a comprehensive file manifest documenting the purpose and function of each extracted file, and (3) annotating key logic with technology-neutral explanations that describe WHAT and WHY rather than React-specific HOW.

The project has a clean structure with 22 source files in `/src` (components, hooks, utils, services) plus 4 API endpoints in `/api`, and a `/versions/v1` folder containing old code that should be excluded from extraction. Modern tooling like Knip can automatically detect unused exports and dead code, while manual code review combined with dependency analysis ensures completeness.

The extracted code must serve as a reference for Rails recreation, so annotations focus on business logic, data flow, validation rules, and edge cases - not React patterns like hooks or state management. The goal is "behavioral fidelity" not "code porting."

**Primary recommendation:** Use Knip for automated dead code detection, madge/dependency-cruiser for dependency visualization, and structured inline annotations with standardized tags (BEHAVIOR, VALIDATION, EDGE_CASE, DATA_FLOW) for technology-neutral documentation.

## Standard Stack

The established tools for code extraction and documentation in JavaScript/React projects:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Knip | Latest (2026) | Dead code detection | Most comprehensive tool for finding unused code, exports, dependencies in JS/TS projects; actively maintained |
| madge | Latest | Dependency visualization | Industry standard for generating module dependency graphs; supports multiple output formats |
| JSDoc | 3.x+ | Inline documentation | Native JavaScript documentation standard; generates HTML docs from comments |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| dependency-cruiser | Latest | Advanced dependency analysis | When needing validation rules and architectural constraints beyond visualization |
| arkit | Latest | Architecture diagram generation | For higher-level component relationships and automatic documentation |
| AST tools (babel/parser) | Latest | Programmatic code analysis | When needing custom extraction logic or transformations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|-----------|-----------|----------|
| Knip | ts-prune | ts-prune is TypeScript-only and less comprehensive than Knip |
| madge | React-Sight | React-Sight is a runtime browser extension (buggy, CPU heavy); madge is static analysis |
| Manual annotation | AI doc generators (Mintlify, Stenography) | AI tools generate API references but lack domain context for "why" explanations |

**Installation:**
```bash
npm install --save-dev knip madge
```

## Architecture Patterns

### Recommended Extraction Structure
```
.planning/phases/06-code-extraction/
├── extracted-code/          # Clean reference code (dead code removed)
│   ├── src/                 # Frontend code with annotations
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks (document behavior, not hook pattern)
│   │   ├── utils/           # Pure functions (most portable)
│   │   └── services/        # API integration
│   ├── api/                 # Serverless functions (document as API contracts)
│   └── styles/              # CSS files (visual reference only)
├── FILE-MANIFEST.md         # Comprehensive file/function inventory
├── DEPENDENCIES.svg         # Visual dependency graph
└── ANNOTATIONS.md           # Annotation legend and conventions
```

### Pattern 1: Technology-Neutral Annotations
**What:** Inline comments using standardized tags that describe business logic independent of implementation framework.

**When to use:** For all core business logic, validation rules, data transformations, and edge case handling.

**Example:**
```javascript
// BEHAVIOR: Current hour slot remains visible until :59 of that hour
// WHY: Users should be able to book "right now" until the hour actually ends
// EDGE_CASE: At 9:59 AM, the 9:00 AM slot is still available, not past
if (isSlotPast(now, currentHour)) {
  return false;
}

// VALIDATION: Booking duration cannot extend beyond END_HOUR (10 PM)
// DATA_CONSTRAINT: END_HOUR is a system constant (22 in 24hr format)
if (selectedSlot.hour + duration > END_HOUR) {
  return false;
}

// DATA_FLOW: Timezone is display-only, all storage uses Queensland time
// WHY: Queensland has no DST; simplifies data layer
const todayKey = formatDate(now); // Always QLD timezone internally
```

### Pattern 2: File Manifest Structure
**What:** Structured markdown table documenting every file's purpose, key functions, and dependencies.

**When to use:** As the primary index/map for the extracted codebase.

**Example:**
```markdown
### src/hooks/useBookings.js
**Purpose:** Manages booking state, validation, and persistence
**Type:** Custom React hook (Rails equivalent: service object/model concern)
**Key Functions:**
- `getSlotStatus(date, time, hour)` - Returns slot state (available/booked/blocked/past)
- `canBook(date, time, hour, duration)` - Validates if booking is possible
- `createBooking(date, time, user, duration)` - Creates and persists booking
**Dependencies:** api.js, time.js, storage.js
**Technology-Neutral Behavior:**
- Bookings have user, start time, duration (in hours)
- Slots are 1-hour increments from START_HOUR to END_HOUR
- Multi-hour bookings reserve consecutive slots
- Past slots cannot be booked (checked server-side too)
```

### Pattern 3: Dependency Graph as Architecture Documentation
**What:** Visual graph showing component/module relationships, generated from actual imports.

**When to use:** To understand data flow, identify core vs peripheral modules, detect circular dependencies.

**Example workflow:**
```bash
# Generate dependency graph
npx madge --image DEPENDENCIES.svg --exclude 'node_modules' src/

# Identify circular dependencies (should be none)
npx madge --circular src/

# Show dependency tree for specific file
npx madge --depends src/App.jsx src/
```

### Anti-Patterns to Avoid

- **Copying React patterns verbatim:** Don't document useState/useEffect mechanics; document the state behavior and side effect purpose
- **Including dead code "just in case":** Future maintainers will be confused; remove it and rely on git history
- **Framework-specific terminology:** Avoid "hook", "component lifecycle", "props" - use "function", "initialization", "parameters"
- **Assuming implicit context:** What's obvious in React isn't obvious in Rails; explicitly document data structures, validation rules, constants
- **Incomplete dependency cleanup:** Old imports to removed code will confuse dependency analysis; clean thoroughly

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding unused code | Manual search or grep for imports | Knip | Handles complex cases: re-exports, barrel files, dynamic imports, TypeScript types |
| Dependency visualization | Manually documenting imports | madge or dependency-cruiser | Automatic, accurate, multiple formats (SVG, PNG, JSON) |
| Code annotation extraction | Custom script to parse comments | JSDoc or structured markdown | Standardized formats, tooling support, documentation generation |
| Dead CSS detection | Manual review of CSS files | UnCSS or PurgeCSS | Analyzes HTML/React for actually-used selectors |
| Import path analysis | Grep for require/import | AST-based tools (babel-parser) | Handles all import syntax: named, default, dynamic, re-exports |

**Key insight:** Code analysis is fundamentally an Abstract Syntax Tree (AST) problem. Tools that parse code into ASTs handle edge cases (string imports, re-exports, aliasing) that regex/grep cannot. For this phase, use AST-based tools rather than pattern matching.

## Common Pitfalls

### Pitfall 1: Including Old Code from `/versions/v1`
**What goes wrong:** The `/versions/v1` folder contains the previous iteration with different component structure and missing features (no Book Now, old booking panel). Including this in extraction pollutes the reference.

**Why it happens:** File globbing patterns catch all `/src` paths including nested version folders.

**How to avoid:** Explicitly exclude version folders in all tooling configurations and extraction scripts:
```json
// knip.json
{
  "ignore": ["versions/**", "dist/**", "node_modules/**"]
}
```

**Warning signs:** Duplicate component names, older CSS patterns, missing features in dependency graph.

### Pitfall 2: Documenting React-Specific Implementation Details
**What goes wrong:** Annotations explain useCallback memoization, useEffect dependency arrays, or useState updates - none of which matter for Rails implementation.

**Why it happens:** Natural tendency to explain what you see in the code rather than what it accomplishes.

**How to avoid:** Frame every annotation as "If I had to rebuild this behavior in a different framework, what would I need to know?" Ask:
- What data is tracked? (not which state hook)
- When does this run? (not which lifecycle method)
- What validation rules apply? (not how they're implemented)
- What are the edge cases? (always relevant)

**Warning signs:** Words like "hook", "memo", "props", "JSX" in annotations.

### Pitfall 3: Incomplete Dead Code Removal
**What goes wrong:** Old functions, commented-out code blocks, unused imports remain in extracted code, confusing the purpose of files.

**Why it happens:** Fear of removing "potentially useful" code; uncertainty about whether code is actually used.

**How to avoid:**
1. Run Knip to identify unused exports/functions
2. Check git history - if code hasn't changed in months and isn't used, remove it
3. Validate with dependency graph - unused functions won't appear
4. Trust the tools over intuition

**Warning signs:** Functions/exports not appearing in dependency graph, TODO comments from old features, import statements with no usage.

### Pitfall 4: Missing Data Structure Definitions
**What goes wrong:** Code references object shapes (booking, slot, user) but doesn't explicitly document the structure, types, or constraints.

**Why it happens:** In TypeScript projects, types are documentation; in JSDoc-annotated JS, developers assume shapes are obvious from usage.

**How to avoid:** Document all data structures explicitly in manifest or separate DATA-STRUCTURES.md:
```markdown
### Booking Object
```javascript
{
  user: string,           // User display name (e.g., "Clinton")
  duration: number,       // Hours (1-8), validated ≤ remaining slots in day
  createdAt: timestamp    // ISO 8601 string, server-generated
}
```
**Constraints:**
- Duration must not extend beyond END_HOUR
- User must match one of configured users
- CreatedAt used for conflict resolution in distributed sync
```

**Warning signs:** Rails developer asking "what fields does a booking have?" or "what's the valid range for duration?"

### Pitfall 5: No Trace from Screenshots to Code
**What goes wrong:** Phase 5 captured annotated screenshots, but there's no mapping from visual elements to the code files that implement them.

**Why it happens:** Screenshots and code are documented separately without cross-references.

**How to avoid:** Add screenshot references to file manifest:
```markdown
### src/components/BookingPanel.jsx
**Visual reference:**
- Screenshots: 002-date-selected-with-panel.png, 003-booking-flow-user-selected.png
- Annotated: 01-initial-states--002-date-selected-with-panel.png
```

Or reference code files in SCREENSHOT-MANIFEST.md.

**Warning signs:** Rails developer recreating UI from screenshots but missing validation logic hidden in code.

## Code Examples

Verified patterns from the actual codebase:

### Dead Code Detection with Knip
```bash
# Install Knip
npm install --save-dev knip

# Create knip.json configuration
cat > knip.json << 'EOF'
{
  "entry": ["src/main.jsx", "api/**/*.js"],
  "project": ["src/**/*.{js,jsx}", "api/**/*.js"],
  "ignore": ["versions/**", "dist/**", "scripts/**"],
  "ignoreDependencies": ["@vitejs/plugin-react"]
}
EOF

# Run analysis
npx knip

# Output shows:
# - Unused files
# - Unused exports
# - Unused dependencies
# - Unlisted dependencies
```

### Dependency Graph Generation
```bash
# Generate SVG graph
npx madge --image DEPENDENCIES.svg \
  --exclude 'node_modules' \
  --extensions js,jsx \
  src/main.jsx

# Generate JSON for programmatic analysis
npx madge --json \
  --exclude 'node_modules' \
  src/main.jsx > dependencies.json

# Check for circular dependencies
npx madge --circular src/
# Should output: "No circular dependencies found!"
```

### Technology-Neutral Annotation Template
```javascript
/**
 * FUNCTION: getSlotStatus
 *
 * PURPOSE: Determine visual/interactive state of a time slot
 *
 * INPUTS:
 *   - dateKey: string (YYYY-MM-DD format, QLD timezone)
 *   - timeKey: string (HH:00 format, 24-hour)
 *   - hour: number (0-23, used for past-check)
 *
 * RETURNS: { status: string, booking: object|null }
 *   status values: 'available' | 'booked' | 'blocked' | 'past'
 *
 * BEHAVIOR:
 *   1. Check if slot is in the past (compared to current QLD time)
 *   2. Check if slot has an active booking
 *   3. Check if slot is blocked by multi-hour booking starting earlier
 *   4. Default to available
 *
 * EDGE_CASES:
 *   - Multi-hour bookings block multiple consecutive slots
 *   - Past check uses current hour + minute (not just hour)
 *   - Blocked slots don't have their own booking object
 *
 * VALIDATION:
 *   - No validation (read-only query)
 */
export function getSlotStatus(dateKey, timeKey, hour) {
  // Implementation...
}
```

### File Manifest Entry Template
```markdown
## src/utils/time.js

**Category:** Pure utility functions
**Purpose:** Time calculations, formatting, and validation
**Dependencies:** None (no imports)
**Used by:** App.jsx, Header.jsx, TimeStrip.jsx, BookingPanel.jsx, useBookings.js

### Constants
- `START_HOUR = 6` - Booking day starts at 6:00 AM
- `END_HOUR = 22` - Booking day ends at 10:00 PM (last slot is 9:00 PM)
- `TIME_SLOTS` - Array of all valid time slots (16 total)

### Key Functions

#### `formatDate(date) → string`
**Purpose:** Convert Date object to YYYY-MM-DD string in QLD timezone
**Why QLD:** Queensland has no DST, simplifies storage
**Returns:** "2026-02-13"

#### `isSlotPast(date, hour) → boolean`
**Purpose:** Check if time slot is in the past
**Behavior:** Compares date+hour to current time in QLD timezone
**Edge case:** At 9:59 AM, hour 9 is NOT past (still within the hour)
**Returns:** true if slot should be disabled

#### `formatTimeKey(hour) → string`
**Purpose:** Convert hour number to HH:00 format for storage keys
**Returns:** "09:00", "14:00", etc.

### Technology-Neutral Notes
All time storage uses Queensland timezone (AEST, no DST transitions).
Display can toggle NSW timezone but storage remains QLD.
This simplifies booking logic and avoids DST edge cases.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual code review for dead code | AST-based static analysis (Knip) | 2023-2024 | Automated detection of unused exports, types, dependencies |
| grep/regex for dependency analysis | AST-based dependency graphs (madge) | Established practice | Handles complex import patterns, re-exports, dynamic imports |
| Separate documentation files | Inline JSDoc with doc generation | Long-standing standard | Documentation stays in sync with code |
| AI generates generic comments | Human-written behavior annotations | Current best practice | Captures domain knowledge and "why" that AI cannot infer |
| Port code between frameworks | Extract behavior specs, reimplement | Framework-agnostic migration pattern | Avoids impedance mismatch from literal porting |

**Deprecated/outdated:**
- ts-prune: Less comprehensive than Knip, TypeScript-only, not actively maintained
- React-Sight: Browser extension for runtime visualization; buggy, heavy, static analysis better
- Puppeteer for screenshots: Phase 5 correctly used Playwright (better stability, modern API)

## Open Questions

Things that couldn't be fully resolved:

1. **CSS Dead Code Removal**
   - What we know: Tools like UnCSS and PurgeCSS can remove unused CSS selectors
   - What's unclear: Whether CSS should be "extracted" (cleaned reference) or just "documented" (visual reference only)
   - Recommendation: Include cleaned CSS in extraction for completeness, but mark as "visual reference - Rails uses different styling approach"

2. **API Endpoint Documentation Format**
   - What we know: API routes in `/api` are Vercel serverless functions, Rails won't use this pattern
   - What's unclear: Best format for documenting endpoints - OpenAPI spec vs annotated code vs separate API doc
   - Recommendation: Annotate API files with request/response examples, validation rules, error cases; consider OpenAPI if Rails needs formal API contract

3. **Depth of Dependency Graph**
   - What we know: Full graph including all internal modules can be generated
   - What's unclear: Whether to graph external dependencies (react, @vercel/kv) or only internal modules
   - Recommendation: Internal modules only for clarity; external deps documented in FILE-MANIFEST

4. **Handling Environment-Specific Code**
   - What we know: KV storage (Vercel-specific) won't exist in Rails
   - What's unclear: Whether to document storage layer abstractly or include Vercel specifics as example
   - Recommendation: Document storage as interface (getBookings, saveBooking, etc.) with note that implementation is environment-specific

## Sources

### Primary (HIGH confidence)
- [Knip Official Docs](https://knip.dev) - Dead code detection configuration and usage
- [Knip Configuration Reference](https://knip.dev/reference/configuration) - Entry points, ignore patterns
- [madge GitHub](https://github.com/pahen/madge) - Dependency graph generation
- [Effective TypeScript: Use knip to detect dead code and types](https://effectivetypescript.com/2023/07/29/knip/) - Best practices
- [JSDoc Official](https://www.oracle.com/technical-resources/articles/java/javadoc-tool.html) - Documentation standards

### Secondary (MEDIUM confidence)
- [Dead Code Elimination | Tooling.Report](https://bundlers.tooling.report/transformations/dead-code/) - Comparison of tools
- [Qodo AI: Code Documentation Best Practices 2026](https://www.qodo.ai/blog/code-documentation-best-practices-2026/) - Documentation strategies
- [Stack Overflow: Documents the architect's programming language](https://stackoverflow.blog/2026/01/01/documents-the-architect-s-programming-language/) - Documentation philosophy
- [Smashing Magazine: Frankenstein Migration Part 1](https://www.smashingmagazine.com/2019/09/frankenstein-migration-framework-agnostic-approach-part-1/) - Framework-agnostic migration patterns
- [dependency-cruiser GitHub](https://github.com/sverweij/dependency-cruiser) - Advanced dependency analysis

### Tertiary (LOW confidence)
- [Web Components for framework migration](https://www.smashingmagazine.com/2019/09/frankenstein-migration-framework-agnostic-approach-part-2/) - Alternative migration approach (not applicable but informative)
- [AI Documentation Generators](https://www.nxcode.io/resources/news/ai-documentation-generator-2026) - Emerging tools (not recommended for this phase due to lack of domain context)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Knip and madge are industry standard, well-documented, actively maintained
- Architecture patterns: HIGH - Patterns verified from official documentation and established practices
- Technology-neutral annotations: MEDIUM - Pattern is sound but execution requires domain knowledge and judgment
- Pitfalls: HIGH - Based on direct observation of project structure (versions folder) and common migration anti-patterns

**Research date:** 2026-02-13
**Valid until:** 60 days (tools stable, patterns evergreen)
**Codebase inspected:** 22 active source files in /src, 4 API endpoints, confirmed /versions/v1 old code exists
