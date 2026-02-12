# Phase 8: Architecture Documentation - Research

**Researched:** 2026-02-13
**Domain:** Technical architecture documentation for cross-framework reimplementation
**Confidence:** HIGH

## Summary

This research investigates how to document system architecture for Rails reimplementation. The goal is to create comprehensive documentation that enables perfect recreation of the booking form's behavior in a different technology stack.

The standard approach in 2026 combines several documentation formats:
- **OpenAPI/Schema specifications** for API contracts with concrete request/response examples
- **Data flow diagrams** showing state transitions and update patterns
- **Environment configuration documentation** with .env.example files and validation schemas
- **Polling mechanism specifications** documenting intervals, triggers, and conflict detection logic
- **Storage schema documentation** showing key structures, data formats, and constraints

Modern architecture documentation emphasizes **technology-neutral behavior specifications** over implementation details. The documentation consumer (Rails developer) needs to understand WHAT the system does and WHY, not HOW React does it.

**Primary recommendation:** Create five focused architecture documents covering data storage, API contracts, polling sync, state management, and instance configuration - each with explicit schemas, examples, and edge case documentation.

## Standard Stack

Documentation tools and formats for architecture documentation in 2026:

### Core
| Tool/Format | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| OpenAPI Specification | 3.2.0 | API endpoint documentation with schemas | Industry standard for RESTful API docs, machine-readable, supports examples |
| Markdown | - | Human-readable documentation | Universal format, version-controllable, readable in any editor |
| JSON Schema | Draft 2020-12 | Data structure validation and documentation | Standard for describing JSON data formats with validation rules |
| Mermaid | Latest | Data flow and state diagrams | Text-based diagramming that lives in markdown, widely supported |

### Supporting
| Tool/Format | Version | Purpose | When to Use |
|-------------|---------|---------|-------------|
| .env.example files | - | Document required environment variables | Standard practice for documenting configuration needs |
| Request/Response examples | - | Concrete API usage examples | Essential for API consumers, shows real data shapes |
| State flow diagrams | - | Visualize application state transitions | Complex state management needs visual explanation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAPI | Postman Collections | Less standard, vendor lock-in vs universal format |
| Markdown | Confluence/Notion | Requires account access vs version-controlled files |
| JSON Schema | TypeScript types | Language-specific vs language-agnostic |

**Installation:**
```bash
# No installation needed - these are documentation formats
# Optional: validation tools
npm install -g @apidevtools/swagger-cli  # Validate OpenAPI specs
npm install -g ajv-cli                    # Validate JSON schemas
```

## Architecture Patterns

### Recommended Document Structure

```
.planning/phases/08-architecture-documentation/
├── 01-DATA-STORAGE.md           # Vercel KV schema, key patterns, data formats
├── 02-API-CONTRACTS.md          # All endpoints with OpenAPI-style docs
├── 03-POLLING-SYNC.md           # Real-time sync mechanism
├── 04-STATE-MANAGEMENT.md       # Application state flow and triggers
├── 05-INSTANCE-CONFIG.md        # Environment variables and per-instance settings
└── schemas/                     # JSON schemas for validation
    ├── booking.schema.json
    ├── config.schema.json
    └── storage.schema.json
```

### Pattern 1: API Endpoint Documentation (OpenAPI-inspired)

**What:** Document each endpoint with method, path, request body schema, response schema, error cases, and concrete examples.

**When to use:** For every API endpoint that Rails must reimplement.

**Example:**
```markdown
### POST /api/bookings

Create a new booking.

**Request:**
```json
{
  "dateKey": "2026-02-14",
  "timeKey": "07:00",
  "user": "Jack",
  "duration": 2
}
```

**Success Response (201):**
```json
{
  "success": true,
  "booking": {
    "dateKey": "2026-02-14",
    "timeKey": "07:00",
    "user": "Jack",
    "duration": 2
  }
}
```

**Error Responses:**
- 400 Bad Request: Missing/invalid fields
- 409 Conflict: Slot already booked or duration conflicts
- 500 Internal Server Error: Server error

**Validation Rules:**
- dateKey: YYYY-MM-DD format
- timeKey: HH:00 format (00-23)
- user: String, max 100 chars
- duration: Integer 1-8

**Conflict Detection:**
Checks all slots from start hour to start hour + duration.
Rejects if ANY slot in range is booked or blocked.
```

**Source:** [Microsoft Learn - API Design Best Practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design), [Postman API Documentation Guide](https://www.postman.com/api-platform/api-documentation/)

### Pattern 2: Data Schema Documentation

**What:** Document data structures with field types, formats, constraints, and example values.

**When to use:** For all data stored in database/KV store and passed between API layers.

**Example:**
```markdown
## Booking Object

Core data structure representing a scheduled booking.

**Schema:**
```json
{
  "user": "string (required, max 100 chars)",
  "duration": "integer (required, 1-8)"
}
```

**Constraints:**
- User must match a configured user name from instance config
- Duration must be 1-8 hours (no half hours)
- Duration cannot extend beyond END_HOUR (22:00)

**Example:**
```json
{
  "user": "Jack",
  "duration": 2
}
```

**Storage Location:**
Key: `instance:{slug}:bookings`
Nested path: `[dateKey][timeKey]`
Full path example: `bookings["2026-02-14"]["07:00"]`
```

**Source:** [Sifflet - Data Schema Best Practices](https://www.siffletdata.com/blog/data-schema), [Hevo Data - Schema Examples](https://hevodata.com/learn/schema-example/)

### Pattern 3: State Flow Documentation

**What:** Document what state exists, how it flows between components, and what triggers updates.

**When to use:** For complex state that persists across multiple user interactions.

**Example:**
```markdown
## Booking State Flow

### State Shape
```javascript
{
  bookings: {
    "YYYY-MM-DD": {
      "HH:00": { user: string, duration: number }
    }
  },
  loading: boolean,
  error: string | null
}
```

### Initialization Flow
1. App loads → fetch all bookings from API
2. Store in local cache (bookings state)
3. Start polling sync (every 7 seconds)

### Update Flow (Create)
1. User selects slot + user + duration
2. **Optimistic update:** Immediately add to local cache
3. **API call:** POST /api/bookings in background
4. **On success:** No action (optimistic update was correct)
5. **On error:** Trigger sync to rollback and get correct state

### Sync Flow (Polling)
1. Every 7 seconds: Fetch all bookings
2. Compare with local cache
3. If different: Replace local cache (picks up other users' changes)
4. UI re-renders with new data

### State Triggers
- Create booking → optimistic update + API call
- Update booking → optimistic update + API call
- Delete booking → optimistic update + API call
- Poll fires → replace entire state
- Error occurs → trigger manual sync (rollback)
```

**Source:** [Nucamp - State Management 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns), [Syncfusion - React State Management](https://www.syncfusion.com/blogs/post/react-state-management-libraries)

### Pattern 4: Environment Configuration Documentation

**What:** Document all environment variables with purpose, format, and example values using .env.example files.

**When to use:** For any configurable deployment settings.

**Example:**
```markdown
## Environment Variables

### Required Variables

| Variable | Purpose | Format | Example |
|----------|---------|--------|---------|
| `KV_REST_API_URL` | Vercel KV database URL | HTTPS URL | `https://abc123.kv.vercel-storage.com` |
| `KV_REST_API_TOKEN` | Vercel KV access token | Token string | `VercelKVToken_abc123...` |
| `INSTANCE_SLUG` | Instance identifier (determines which data to load) | Lowercase alphanumeric + hyphens | `cps-software` |

### Optional Variables

| Variable | Purpose | Format | Default |
|----------|---------|--------|---------|
| `VITE_USE_API` | Enable API backend vs localStorage fallback | `"true"` or `"false"` | `"true"` |

### Per-Instance Differences

**Default instance (cps-software):**
- Uses Vercel KV for storage
- 6 users configured
- INSTANCE_SLUG=cps-software

**Alternative instance (example-clinic):**
- Same KV database (different key prefix)
- Different users configured in `instance:example-clinic:config`
- INSTANCE_SLUG=example-clinic

**Validation:**
All environment variables are validated at startup. Missing required variables cause fatal error.
```

**Source:** [OneNine - Environment-Specific Configurations](https://onenine.com/best-practices-for-environment-specific-configurations/), [Configu - Environment Variables Best Practices](https://configu.com/blog/environment-variables-how-to-use-them-and-4-critical-best-practices/)

### Pattern 5: Polling Mechanism Documentation

**What:** Document polling interval, what triggers polls, conflict detection, and error handling.

**When to use:** For real-time sync mechanisms.

**Example:**
```markdown
## Polling Sync Mechanism

### Configuration
- **Interval:** 7000ms (7 seconds)
- **Enabled when:** API mode is enabled (VITE_USE_API=true)
- **Disabled when:** localStorage fallback mode

### Behavior
1. Timer starts on app load
2. Every 7 seconds: Fetch all bookings from API
3. Replace local cache with fetched data
4. UI automatically re-renders

### Conflict Detection
**No explicit conflict detection.** Last write wins (server state is truth).

**Scenario:** User A creates booking at 7:00 while User B creates booking at same slot
1. Both users see optimistic update (booking appears immediately)
2. One API call arrives first → succeeds
3. Second API call arrives → returns 409 Conflict error
4. User B's optimistic update rolls back via sync
5. User B sees User A's booking after next poll (within 7 seconds)

### Error Handling
- Polling errors are **non-fatal** (logged to console, don't interrupt user)
- Failed polls don't stop timer (next poll happens in 7 seconds)
- User can manually refresh to force sync

### Manual Sync
Available via `refreshBookings()` function.
Triggers immediate fetch outside polling cycle.
Used after failed create/update/delete to rollback optimistic updates.
```

**Source:** [GeeksforGeeks - Polling in System Design](https://www.geeksforgeeks.org/system-design/polling-in-system-design/), [Enterprise Integration Patterns - Polling](https://www.enterpriseintegrationpatterns.com/patterns/conversation/Polling.html)

### Anti-Patterns to Avoid

- **Don't document React-specific implementation:** Rails developer doesn't need to know about useState or useEffect
- **Don't include only happy paths:** Edge cases and error states are critical for correct reimplementation
- **Don't omit data constraints:** Implicit validation rules lead to bugs in reimplementation
- **Don't document without examples:** Abstract schemas need concrete examples to be understandable

## Don't Hand-Roll

Problems that have existing documentation solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API spec format | Custom JSON format | OpenAPI Specification 3.2 | Industry standard, validation tools exist, widely understood |
| Data validation docs | Prose descriptions | JSON Schema | Machine-readable, validation tools, precise type definitions |
| State flow visualization | Text-only descriptions | Mermaid diagrams | Visual clarity, version-controllable, renders in GitHub/markdown viewers |
| Environment variable docs | README section | .env.example file | Standard practice, shows exact format, easy to copy-paste |
| Request/response examples | Hypothetical data | Real production examples | Captures actual data shapes, shows all fields including optional ones |

**Key insight:** Architecture documentation has well-established patterns in 2026. Following standards makes docs more useful to consumers who recognize familiar formats.

## Common Pitfalls

### Pitfall 1: Technology-Specific Documentation

**What goes wrong:** Documentation explains HOW React implements features instead of WHAT the features do.

**Why it happens:** Documenting FROM code naturally captures implementation details.

**How to avoid:**
- Translate React patterns to technology-neutral concepts before writing
- Use BEHAVIOR/VALIDATION/EDGE_CASE annotation pattern from Phase 6
- Ask "Would a Rails developer understand this without knowing React?"

**Warning signs:**
- Words like "useState", "useEffect", "props", "re-render" in docs
- Explaining component hierarchy instead of data flow
- Describing hooks instead of business logic

**Example fix:**
❌ "The useBookings hook uses useState to manage bookings and useEffect to fetch on mount"
✅ "Bookings state is initialized by fetching all bookings from API. Updates are optimistic (immediate local update + background API call)."

### Pitfall 2: Missing Edge Cases

**What goes wrong:** Documentation shows only happy paths. Rails implementation fails on boundary conditions.

**Why it happens:** Happy paths are obvious from normal usage. Edge cases require code inspection.

**How to avoid:**
- Document EVERY error response code with example
- Explain boundary conditions (what happens at hour 22 with duration 3?)
- Include "what if" scenarios (two users book same slot simultaneously)

**Warning signs:**
- No 409/400 error examples
- No validation constraint documentation
- No explanation of conflict resolution

**Example:**
```markdown
## Edge Cases

**Multi-hour booking at end of day:**
- Booking at 21:00 with duration 2 → ALLOWED (ends at 23:00)
- Booking at 21:00 with duration 3 → REJECTED (would extend past 24:00)
- Validation: start_hour + duration <= 24

**Concurrent booking conflict:**
- User A and User B both try to book 07:00
- First API call succeeds (201 response)
- Second API call fails (409 Conflict)
- No retry logic - user must pick different slot
```

### Pitfall 3: Implicit Data Formats

**What goes wrong:** Documentation assumes readers understand date/time formats. Rails uses different format, data incompatible.

**Why it happens:** Formats seem "obvious" when working in the codebase daily.

**How to avoid:**
- **Always specify format explicitly** with example
- Include regex patterns for validation
- Show both storage format and display format if different

**Warning signs:**
- "Date" without specifying YYYY-MM-DD vs MM/DD/YYYY vs ISO 8601
- "Time" without specifying 24-hour vs 12-hour
- Assuming timezone handling is obvious

**Example:**
```markdown
## Date/Time Formats

**Storage formats (used in API and database):**
- dateKey: YYYY-MM-DD (e.g., "2026-02-14")
- timeKey: HH:00 in 24-hour format (e.g., "07:00", "14:00")
- Validation regex: dateKey: `/^\d{4}-\d{2}-\d{2}$/`, timeKey: `/^(0\d|1\d|2[0-3]):00$/`

**Display formats (UI only, not in data):**
- Date: "Wednesday, February 14, 2026" (via toLocaleDateString)
- Time: "7:00 AM" or "2:00 PM" (12-hour format)

**Timezone handling:**
- All storage uses Queensland time (AEST, UTC+10)
- NSW toggle adds +1 hour to DISPLAY only (not to stored data)
- No timezone conversion in API or database
```

### Pitfall 4: Incomplete Storage Schema

**What goes wrong:** Rails developer doesn't know full key structure. Creates bookings in wrong location, can't read existing data.

**Why it happens:** Key patterns are scattered across multiple API files.

**How to avoid:**
- Document complete key patterns in one place
- Show example keys with actual values
- Explain key prefix/namespace strategy

**Warning signs:**
- Only showing partial keys (missing prefix)
- Not explaining how slug affects keys
- No examples of actual KV keys

**Example:**
```markdown
## Vercel KV Key Structure

**Pattern:** `instance:{slug}:{resource}`

**Configuration key:**
- Pattern: `instance:{slug}:config`
- Example: `instance:cps-software:config`
- Value: JSON object with slug, title, users, createdAt

**Bookings key:**
- Pattern: `instance:{slug}:bookings`
- Example: `instance:cps-software:bookings`
- Value: Nested JSON object { [dateKey]: { [timeKey]: Booking } }

**Full example:**
Key: `instance:cps-software:bookings`
Value:
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 },
    "14:00": { "user": "Bonnie", "duration": 1 }
  }
}
```

**Instance isolation:**
Different INSTANCE_SLUG values create separate key namespaces.
- cps-software reads from `instance:cps-software:*`
- example-clinic reads from `instance:example-clinic:*`
- No data sharing between instances
```

### Pitfall 5: Undocumented State Dependencies

**What goes wrong:** Documentation explains individual operations but not dependencies. Rails implements operations in wrong order, state corrupts.

**Why it happens:** Dependencies are enforced by React component lifecycle, not explicitly documented.

**How to avoid:**
- Document initialization order requirements
- Explain what must complete before what
- Show state dependencies explicitly

**Warning signs:**
- No mention of "must load config before bookings"
- No explanation of optimistic update rollback mechanism
- Operations documented independently without relationships

**Example:**
```markdown
## State Initialization Order

**CRITICAL: Config must load before bookings can be used**

1. Load config from API (`GET /api/config`)
2. Store config in application state
3. Load bookings from API (`GET /api/bookings`)
4. Start polling sync

**Why order matters:**
- User validation requires config.users list
- Booking creation checks user against config
- Loading bookings before config → cannot validate existing bookings

**Rails implementation:**
- Load config in before_action
- Make config available to all controllers
- Don't attempt booking operations if config failed to load
```

## Code Examples

Verified patterns from existing code for documentation:

### Example 1: API Endpoint Documentation Format

```markdown
### POST /api/bookings

**Purpose:** Create a new booking

**Request:**
- Method: POST
- Content-Type: application/json
- Body:
  ```json
  {
    "dateKey": "2026-02-14",    // Required: YYYY-MM-DD format
    "timeKey": "07:00",          // Required: HH:00 format (24-hour)
    "user": "Jack",              // Required: String, max 100 chars
    "duration": 2                // Required: Integer 1-8
  }
  ```

**Success Response (201):**
```json
{
  "success": true,
  "booking": {
    "dateKey": "2026-02-14",
    "timeKey": "07:00",
    "user": "Jack",
    "duration": 2
  }
}
```

**Error Responses:**

400 Bad Request - Missing or invalid fields:
```json
{
  "error": "Missing or invalid fields: dateKey, timeKey, user, duration"
}
```

409 Conflict - Slot already booked:
```json
{
  "error": "Slot already booked"
}
```

409 Conflict - Duration overlaps with existing booking:
```json
{
  "error": "Slot 08:00 conflicts with booking duration"
}
```

**Validation Logic:**
1. Check if start slot (timeKey) is already booked → 409
2. For multi-hour bookings: Check each slot from start to start+duration
3. If ANY slot in range is booked → 409 with specific slot mentioned
4. Only create booking if ALL slots are available

**Example conflict scenario:**
- Existing booking: 07:00 with duration 2 (occupies 07:00 and 08:00)
- New booking attempt: 08:00 with duration 1
- Result: 409 error "Slot 08:00 conflicts with booking duration"
- Explanation: 08:00 is blocked by the 07:00 booking
```

Source: Current implementation in `api/bookings/index.js`

### Example 2: Storage Schema with Nested Structure

```markdown
## Bookings Storage Schema

**Key:** `instance:{slug}:bookings`
**Value Type:** JSON object (nested by date, then time)

**Schema:**
```typescript
{
  [dateKey: string]: {              // YYYY-MM-DD format
    [timeKey: string]: {            // HH:00 format (24-hour)
      user: string,                 // User name (max 100 chars)
      duration: number              // Hours (1-8)
    }
  }
}
```

**Example with multiple bookings:**
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 },
    "14:00": { "user": "Bonnie", "duration": 1 },
    "16:00": { "user": "Giuliano", "duration": 3 }
  },
  "2026-02-15": {
    "09:00": { "user": "John", "duration": 1 }
  }
}
```

**Empty states:**
- No bookings: `{}`
- Date with no bookings: Date key doesn't exist in object
- All bookings deleted for a date: Date key removed from object

**Update pattern (read-modify-write):**
1. Fetch entire bookings object from KV
2. Modify in memory (add/update/delete specific booking)
3. Write entire object back to KV
4. No partial updates (always full object replacement)

**Multi-hour booking representation:**
Only ONE record created at start time.
Duration field indicates how many slots are occupied.
Example: Booking at 07:00 with duration 3 occupies 07:00, 08:00, 09:00
         but only stores: `"07:00": { "user": "Jack", "duration": 3 }`
```

Source: Current implementation in `api/bookings/index.js` and `useBookings.js`

### Example 3: State Flow with Optimistic Updates

```markdown
## Optimistic Update Pattern

**Purpose:** Provide instant UI feedback while API call processes in background

**Flow:**
1. User performs action (create/update/delete booking)
2. **Immediately update local state** (UI updates instantly)
3. **Background API call** starts
4. **On success:** No action needed (optimistic update was correct)
5. **On error:** Trigger sync to fetch true state (rollback optimistic update)

**Example: Create Booking**

Step 1 - Optimistic update (immediate):
```javascript
// Add booking to local cache immediately
bookings["2026-02-14"]["07:00"] = { user: "Jack", duration: 2 }
// UI re-renders, user sees booking instantly
```

Step 2 - API call (background):
```javascript
POST /api/bookings
Body: { dateKey: "2026-02-14", timeKey: "07:00", user: "Jack", duration: 2 }
```

Step 3a - Success path:
```javascript
// 201 response → optimistic update was correct, do nothing
```

Step 3b - Error path:
```javascript
// 409 Conflict response → optimistic update was wrong
// Trigger sync: GET /api/bookings
// Replace entire local cache with server truth (rollback)
// UI re-renders, incorrect booking disappears
```

**Why this pattern:**
- **Instant feedback:** User doesn't wait for network round-trip
- **Self-correcting:** Errors automatically rollback via sync
- **Simple implementation:** No complex CRDT or conflict resolution

**Rails equivalent:**
- Turbo Streams for instant updates
- Optimistic DOM updates with data-turbo-permanent
- Background job for API call
- Turbo Stream update on error to rollback
```

Source: Current implementation in `src/hooks/useBookings.js`

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| Prose-only API docs | OpenAPI 3.2 with schemas and examples | ~2020 | Machine-readable, validation tools, code generation possible |
| Comments in code | Separate architecture docs | Continuous | Clear consumer (Rails dev) vs producer (React code) separation |
| Implementation-focused docs | Behavior-focused docs | ~2024 | Technology-agnostic, easier reimplementation |
| Generic examples | Production data examples | Recent | Shows actual data shapes, catches missing/optional fields |
| Assume knowledge | Explicit format specs | Continuous | Prevents format mismatches between systems |
| Manual diagrams | Text-based diagrams (Mermaid) | ~2022 | Version-controllable, easier to update, renders in markdown |

**Deprecated/outdated:**
- **Swagger 2.0**: Replaced by OpenAPI 3.x (more features, better schema support)
- **RAML**: Less adoption, OpenAPI won as industry standard
- **API Blueprint**: Simpler but less powerful than OpenAPI
- **Inline TODO comments**: Architecture decisions should be in dedicated docs, not scattered in code

## Open Questions

Things that couldn't be fully resolved:

1. **OpenAPI tooling for validation**
   - What we know: OpenAPI 3.2 is current standard
   - What's unclear: Whether to include full OpenAPI YAML file or use OpenAPI-inspired markdown
   - Recommendation: Use OpenAPI-inspired markdown (more readable, sufficient for single consumer) unless multi-consumer API

2. **Diagram tool choice**
   - What we know: Mermaid is popular for text-based diagrams
   - What's unclear: Whether state flow diagrams add significant value vs prose descriptions
   - Recommendation: Start with prose + code examples, add diagrams if state flow is confusing

3. **Schema validation in documentation phase**
   - What we know: JSON Schema can validate data structures
   - What's unclear: Whether to create formal .schema.json files or keep schemas in markdown
   - Recommendation: Keep schemas in markdown for Phase 8 (single consumer), extract to .schema.json files if used for runtime validation later

## Sources

### Primary (HIGH confidence)
- [OpenAPI Specification v3.2.0](https://spec.openapis.org/oas/v3.2.0.html) - Current OpenAPI standard
- [Microsoft Learn - API Design Best Practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design) - API documentation patterns
- [Postman - API Documentation Guide](https://www.postman.com/api-platform/api-documentation/) - Request/response examples
- Existing codebase - Current implementation patterns verified via code inspection

### Secondary (MEDIUM confidence)
- [Imaginary Cloud - Software Architecture Documentation](https://www.imaginarycloud.com/blog/software-architecture-documentation) - Documentation structure
- [FreeCodeCamp - System Architecture Documentation](https://www.freecodecamp.org/news/system-architecture-documentation-best-practices-and-tools/) - Best practices and tools
- [Sifflet - Data Schema Best Practices](https://www.siffletdata.com/blog/data-schema) - Schema documentation patterns
- [Hevo Data - Schema Examples](https://hevodata.com/learn/schema-example/) - Schema design examples
- [OneNine - Environment-Specific Configurations](https://onenine.com/best-practices-for-environment-specific-configurations/) - Config documentation
- [Configu - Environment Variables Best Practices](https://configu.com/blog/environment-variables-how-to-use-them-and-4-critical-best-practices/) - .env.example patterns
- [GeeksforGeeks - Polling in System Design](https://www.geeksforgeeks.org/system-design/polling-in-system-design/) - Polling patterns
- [Enterprise Integration Patterns - Polling](https://www.enterpriseintegrationpatterns.com/patterns/conversation/Polling.html) - Polling documentation

### Tertiary (LOW confidence)
- [Nucamp - State Management 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - State documentation patterns
- [Syncfusion - React State Management](https://www.syncfusion.com/blogs/post/react-state-management-libraries) - State flow documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - OpenAPI and markdown are established industry standards
- Architecture: HIGH - Patterns verified from Microsoft, Postman, and existing code
- Pitfalls: HIGH - Common mistakes identified from prior phase learnings (CONTEXT.md) and documentation best practices

**Research date:** 2026-02-13
**Valid until:** 60 days (architecture documentation standards are stable, slow-changing domain)
