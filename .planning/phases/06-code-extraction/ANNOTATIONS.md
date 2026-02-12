# Code Annotation Legend

This document defines the standardized annotation tags used throughout the extracted code. These annotations explain WHAT the code does and WHY in technology-neutral terms, making it possible to recreate the functionality in any language or framework.

## Annotation Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `BEHAVIOR:` | Describes what a function/module does in plain terms | `BEHAVIOR: Checks if a time slot is available for booking` |
| `VALIDATION:` | Explains a business rule or input constraint | `VALIDATION: Duration must be 1-8 hours` |
| `EDGE_CASE:` | Documents a boundary condition or special scenario | `EDGE_CASE: Current hour stays available until next hour begins` |
| `DATA_FLOW:` | Traces how data moves through the system | `DATA_FLOW: Fetch from server -> update local cache -> notify UI` |
| `DATA_CONSTRAINT:` | Defines the shape, format, or type of data | `DATA_CONSTRAINT: dateKey format is YYYY-MM-DD` |
| `WHY:` | Explains the rationale behind a design decision | `WHY: Queensland timezone chosen because business operates there` |
| `CONSTANT:` | Documents a configurable value with business meaning | `CONSTANT: START_HOUR = 6 (bookings available from 6 AM)` |

## Technology Translation Guide

When reading React code to understand business logic, translate React-specific concepts to their technology-neutral equivalents:

| React Concept | Rails Equivalent | What Matters for Recreation |
|---------------|------------------|----------------------------|
| `useState` | Instance variable | Data that needs to be tracked |
| `useEffect` on mount | Controller action / before_action | Initialization logic that runs once |
| `useEffect` with deps | Observer / callback | Logic that runs when specific data changes |
| `useCallback` | Method definition | A function that does something |
| Props passing | Method parameters | Data flowing into a component/module |
| Re-render | View update | UI refreshes when data changes |
| onClick handler | Route/action | What happens when user clicks |
| "This hook manages..." | "This module tracks..." | Purpose, not implementation |

## Annotation Principles

### DO:
- **Focus on business logic**: "Validates that booking duration doesn't exceed 8 hours"
- **Explain the WHAT and WHY**: "Returns slot status (available/booked/blocked) so UI can render correctly"
- **Document edge cases**: "When hour is 21 and duration is 3, this would exceed END_HOUR, so booking is rejected"
- **Use plain language**: "Multi-hour booking blocks subsequent slots"

### DON'T:
- **Use React jargon**: ❌ "This hook uses useState to manage bookings"
- **Describe implementation details**: ❌ "useEffect runs on mount and sets loading state"
- **Reference framework concepts**: ❌ "Props are passed down to child components"
- **Focus on rendering**: ❌ "Triggers a re-render when bookings change"

## Example: Before and After

### Before (React-focused):
```javascript
// Hook to manage booking state
export function useBookings() {
  const [bookings, setBookings] = useState({});
  // useEffect to fetch on mount
  useEffect(() => { ... }, []);
}
```

### After (Technology-neutral):
```javascript
// BEHAVIOR: Tracks all bookings across all dates and provides operations to create, update, delete bookings
// DATA_FLOW: On initialization -> fetch bookings from server -> store in local cache
//            On create/update/delete -> optimistically update cache -> send to server -> on error, rollback and re-sync
// DATA_CONSTRAINT: bookings object structure: { "YYYY-MM-DD": { "HH:00": { user: string, duration: number } } }
export function useBookings() {
  const [bookings, setBookings] = useState({});
  // On initialization, fetch all bookings from server
  useEffect(() => { ... }, []);
}
```

## Where Annotations Appear

Annotations are inline comments in the extracted code files:

- **At the top of modules**: Describe overall purpose
- **Before key functions**: Explain behavior, validation rules, edge cases
- **At critical decision points**: Document why a condition exists
- **Near data structures**: Define shape and constraints
- **At boundaries**: Document API contracts, data flow between modules

## Reading the Annotated Code

When recreating this system in Rails:

1. **Start with `BEHAVIOR:` tags** to understand what each module does
2. **Read `DATA_CONSTRAINT:` tags** to know data structures
3. **Study `VALIDATION:` and `EDGE_CASE:` tags** to replicate business rules correctly
4. **Follow `DATA_FLOW:` tags** to understand system architecture
5. **Check `WHY:` tags** when you need context for design decisions
6. **Ignore React-specific syntax** - focus on the annotated logic

The goal: Any skilled developer reading the annotated code should be able to recreate identical functionality in their framework of choice.
