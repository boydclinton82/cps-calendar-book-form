# Coding Conventions

**Analysis Date:** 2026-02-04

## Naming Patterns

**Files:**
- React components: PascalCase with .jsx extension (e.g., `BookingBlock.jsx`, `TimeStrip.jsx`)
- Utilities and hooks: camelCase with .js extension (e.g., `useBookings.js`, `colors.js`, `time.js`)
- CSS files: Match component name with .css extension (e.g., `BookingBlock.css` for `BookingBlock.jsx`)
- API routes: kebab-case directory structure with index.js handlers (e.g., `api/bookings/index.js`, `api/bookings/update.js`)

**Functions:**
- Functional components: PascalCase, exported as named exports (e.g., `export function Header(...)`, `export function BookingPanel(...)`)
- Hook functions: camelCase with `use` prefix (e.g., `useBookings()`, `useKeyboard()`, `useConfig()`)
- Regular utility functions: camelCase (e.g., `formatDate()`, `isToday()`, `sanitizeString()`)
- Internal helper functions: camelCase, often kept in same file (e.g., `formatTimeRange()` in `BookingBlock.jsx`, `formatShortHour()` in same file)

**Variables:**
- State variables: camelCase (e.g., `currentDate`, `selectedSlot`, `isWeekView`)
- Constants: UPPER_SNAKE_CASE (e.g., `START_HOUR`, `END_HOUR`, `POLLING_INTERVAL`, `SLOT_COUNT`)
- Object properties: camelCase (e.g., `dateKey`, `timeKey`, `user`, `duration`)
- CSS class names: kebab-case (e.g., `.booking-block`, `.time-slot`, `.panel-header`)
- CSS class selectors for states: lowercase with hyphen (e.g., `.booking-block`, `.selected`, `.disabled`)

**Types:**
- PropTypes documentation uses JSDoc format (see `src/hooks/useConfig.js` for example)
- No TypeScript currently used; types are documented via comments

## Code Style

**Formatting:**
- ESLint configured with `@eslint/js` and React-specific rules
- No explicit Prettier config found, formatting follows ESLint rules
- Indentation: Implicit (configured via ESLint), typically 2-space indentation observed

**Linting:**
- Tool: ESLint 9.17.0 with plugins:
  - `eslint-plugin-react-hooks` - enforces hook rules
  - `eslint-plugin-react-refresh` - checks for HMR safety
  - `@eslint/js` - core JavaScript rules
- Run: `npm run lint`
- No pre-commit hooks configured to enforce linting

**File organization patterns:**
- Imports grouped by type: React/external libraries → internal contexts/hooks → utilities → CSS
- Example from `src/App.jsx`:
  ```javascript
  import { useState, useCallback, useMemo } from 'react';
  import { Header } from './components/Header';
  import { useBookings } from './hooks/useBookings';
  import { formatDate, addDays } from './utils/time';
  import './App.css';
  ```

## Import Organization

**Order:**
1. React/React DOM and external libraries (e.g., `react`, `react-dom`)
2. Internal contexts (e.g., `ConfigContext`, `./context/ConfigContext`)
3. Components (e.g., `./components/Header`)
4. Hooks (e.g., `./hooks/useBookings`)
5. Utilities and services (e.g., `./utils/time`, `./services/api`)
6. CSS imports (e.g., `./App.css`)

**Path Aliases:**
- No path aliases configured (no `jsconfig.json` or `vite.json` with paths)
- All imports use relative paths (e.g., `./hooks/useBookings`, `../utils/time`)

## Error Handling

**Frontend patterns:**
- Error states stored in component/hook state: `const [error, setError] = useState(null)`
- Errors from async operations caught with try/catch blocks
- API errors logged to console: `console.error('Failed to load bookings:', err)`
- User-facing errors stored but fallback values often used (e.g., in `ConfigContext`, fallback to `FALLBACK_CONFIG`)
- No error boundary components currently implemented

**API/Backend patterns (`api/` directory):**
- Status codes used consistently:
  - `200` - Success (GET)
  - `201` - Created (POST)
  - `400` - Bad request (missing/invalid fields)
  - `405` - Method not allowed
  - `409` - Conflict (slot already booked)
  - `429` - Rate limit exceeded
  - `500` - Internal server error
- Error responses always return JSON: `{ error: 'Error message' }`
- Errors wrapped in try/catch at handler level, logged to console, return `500` status
- No custom error classes; plain Error objects used

**Fallback and graceful degradation:**
- API service (`src/services/api.js`) falls back to localStorage when API unavailable
- Config fetching falls back to `FALLBACK_CONFIG` when API disabled
- Bookings are synced via polling with error recovery using `triggerSync()`
- Optimistic updates implemented: state updated immediately, synced on error

## Logging

**Framework:** `console` object (no dedicated logging library)

**Patterns:**
- Log level inference from pattern:
  - `console.error()` - failures, API errors, storage errors
  - `console.warn()` - fallback scenarios, CORS warnings, rate limit failures
  - `console.log()` - general info (not heavily used)
- Log messages include context: `'Failed to load bookings:'`, `'API unavailable, falling back to localStorage'`
- Error objects passed to console: `console.error('Error:', err)`
- No structured logging or log levels; all important events logged

**Examples:**
- `src/hooks/useBookings.js`: `console.error('Failed to create booking:', err)`
- `src/services/api.js`: `console.warn('API unavailable, falling back to localStorage')`
- `api/_lib/security.js`: `console.error('Rate limit check failed:', error)`

## Comments

**When to Comment:**
- Complex business logic (e.g., slot blocking logic in `useSlotBlocked()`)
- Non-obvious calculations (e.g., time range formatting in `BookingBlock.jsx`)
- Constants that need explanation (e.g., `SLOT_HEIGHT = 36` includes "Approximate height of a TimeSlot")
- CSS constants that must match between components (e.g., `SLOT_HEIGHT` in `BookingBlock.jsx` must match CSS in `TimeSlot.css`)
- Time handling edge cases (e.g., past slot calculation for today vs past dates)

**JSDoc/TSDoc:**
- Used for hook functions and utilities with external APIs
- Example from `src/hooks/useConfig.js`:
  ```javascript
  /**
   * Hook to access the configuration context.
   *
   * @returns {{
   *   config: object | null,
   *   loading: boolean,
   *   error: string | null,
   *   title: string,
   *   users: Array<{name: string, key: string}>,
   *   slug: string
   * }}
   */
  ```
- API functions include JSDoc blocks (e.g., `src/services/api.js` methods documented)
- Security functions documented with purpose and options (e.g., `api/_lib/security.js`)

**Inline comments:**
- Used sparingly for non-obvious logic
- Example: `// Duration options (not configurable per instance)` in `useKeyboard.js`
- Comments above complex conditions: `// Check if duration would exceed time range`

## Function Design

**Size:**
- Most functions 20-40 lines
- Larger functions (50+ lines) have clear logical sections, e.g., `BookingBlock.jsx` component with position calculation
- Hook functions organize state management and side effects clearly

**Parameters:**
- Destructured from objects when multiple parameters (see `BookingBlock.jsx` prop destructuring)
- Named parameters preferred over positional (e.g., `sanitizeBookingInput({ dateKey, timeKey, user, duration })`)
- Callbacks passed explicitly for clear component intent (e.g., `onUserSelect`, `onDurationSelect`)

**Return Values:**
- Components return JSX or null (conditional rendering)
- Hooks return objects with named functions and state values (e.g., `useBookings()` returns `{ bookings, loading, error, createBooking, ... }`)
- Utilities return values directly (strings, booleans, objects)
- API functions return JSON objects or throw errors

## Module Design

**Exports:**
- Named exports preferred: `export function Header(...)`, `export function useBookings()`
- Default exports used for App component: `export default App`
- Utilities export multiple related functions: `export { sanitizeBookingInput, sanitizeString }` from `api/_lib/security.js`

**Barrel Files:**
- Not used; components imported directly from their files
- No index.js barrel files in component directories

**Context Provider pattern:**
- Context created with `createContext()` and exported
- Provider component `ConfigProvider` wraps children
- Hook `useConfig()` accesses context with error handling:
  ```javascript
  if (context === null) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  ```

---

*Convention analysis: 2026-02-04*
