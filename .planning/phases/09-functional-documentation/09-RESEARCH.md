# Phase 9: Functional Documentation - Research

**Researched:** 2026-02-13
**Domain:** Functional behavior specification and edge case documentation
**Confidence:** HIGH

## Summary

Functional documentation describes WHAT HAPPENS when users interact with the system - the behavior, business logic, decision flows, and edge cases. This is distinct from architecture (HOW data flows) and UI/UX (WHAT things look like).

For Phase 9, the standard approach is to document behavior in a technology-neutral way using:
1. **Step-by-step workflows** with decision points and branching logic
2. **Decision tables** for conditional logic (when X, then Y)
3. **Edge case catalogs** documenting failure modes and boundary conditions
4. **State machines** for complex interactive flows
5. **Given-When-Then scenarios** (BDD format) for testable specifications

**Primary recommendation:** Use a hybrid approach combining workflow narratives (for linear flows), decision tables (for conditional logic), and edge case catalogs (for boundary conditions). Write in technology-neutral language that describes behavior outcomes, not React/Rails implementation details.

## Standard Stack

For functional specification documentation (not executable code):

### Core Documentation Patterns

| Pattern | Purpose | Why Standard |
|---------|---------|--------------|
| User Workflows | Document step-by-step interaction flows | Industry standard for describing user journeys with decision points |
| Decision Tables | Document conditional logic and rules | DMN (Decision Model and Notation) is OMG standard for business rules |
| Given-When-Then Scenarios | Testable behavior specifications | BDD (Behavior-Driven Development) format bridges business and technical specs |
| Edge Case Catalogs | Exhaustive boundary condition documentation | Prevents "what if" gaps in implementation |
| State Transition Diagrams | Document complex UI state flows | UML state machines are standard for interactive behavior |

### Supporting Formats

| Format | Purpose | When to Use |
|--------|---------|-------------|
| Sequence Diagrams | Time-ordered interaction flows | Multi-component interactions (booking panel → API → state update) |
| Truth Tables | Boolean logic specification | Simple yes/no conditions (e.g., "Book Now button visibility") |
| Markdown Tables | Structured condition-outcome mappings | Quick reference for implementers |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Structured tables/narratives | Gherkin `.feature` files only | Gherkin is executable but verbose; mix is better for AI consumer |
| Decision tables | Prose descriptions | Tables are scannable; prose hides logic in sentences |
| Exhaustive edge cases | "Handle errors gracefully" | Vague guidance leads to inconsistent implementations |

**Installation:**
N/A - This is documentation, not code. No libraries needed.

## Architecture Patterns

### Recommended Document Structure

For Phase 9 functional documentation:

```
.planning/phases/09-functional-documentation/
├── BOOKING-FLOW.md              # Complete booking workflow with decision trees
├── BOOK-NOW-FEATURE.md          # Book Now button logic and visibility rules
├── TIMEZONE-TOGGLE.md           # Timezone display conversion and DST detection
├── EDGE-CASES.md                # Comprehensive edge case catalog
└── TIME-DATE-HANDLING.md        # Time calculations, slot logic, navigation
```

### Pattern 1: Workflow Documentation with Decision Points

**What:** Step-by-step description of user flows with embedded decision tables for branching logic

**When to use:** Linear user journeys with conditional branches (e.g., booking flow)

**Example structure:**
```markdown
## Booking Flow

### Step 1: Slot Selection
**User action:** Click available time slot
**System behavior:**
1. Mark slot as selected (visual highlight)
2. Open booking panel (slide in from right)
3. Focus on user selection section

**Decision point:** Can user book this slot?

| Condition | Outcome |
|-----------|---------|
| Slot is available AND not past | Proceed to Step 2 |
| Slot is booked | Show booking popup instead (edit flow) |
| Slot is past | No interaction (cursor: not-allowed) |

### Step 2: User Selection
...
```

**Source:** [A Guide to Functional Requirements](https://www.nuclino.com/articles/functional-requirements), [Workflow Documentation Guide](https://www.proprofskb.com/blog/workflow-documentation/)

### Pattern 2: Decision Tables (DMN-Inspired)

**What:** Tabular representation of conditions and outcomes

**When to use:** Complex conditional logic with multiple inputs determining behavior

**Example structure:**
```markdown
## Book Now Button Visibility

| Current Hour Available? | Current Hour Past? | Current Hour Booked? | Button State |
|-------------------------|-------------------|---------------------|--------------|
| Yes | No | No | VISIBLE (pulsing) |
| Yes | Yes | No | HIDDEN (hour ended) |
| Yes | No | Yes | HIDDEN (already booked) |
| No | — | — | HIDDEN (out of range) |
```

**Source:** [DMN Business Rules and Decision Tables](https://www.solver.com/dmn-business-rules-decision-tables), [DMN Specification (OMG)](https://www.omg.org/dmn/)

### Pattern 3: Given-When-Then Scenarios (BDD Format)

**What:** Executable specification format describing preconditions, actions, and expected outcomes

**When to use:** Behavior that needs to be testable; edge cases; regression prevention

**Example structure:**
```markdown
## Scenario: Multi-hour booking spans midnight

**Given** user selects 21:00 time slot (9 PM)
**And** operating hours end at 22:00 (10 PM)
**When** user attempts to book 3-hour duration
**Then** only 1-hour option is enabled (21:00-22:00)
**And** 2-hour and 3-hour options are disabled
**Because** booking cannot extend beyond operating hours
```

**Source:** [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/), [Writing Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)

### Pattern 4: Edge Case Catalog

**What:** Exhaustive list of boundary conditions, failure modes, and unexpected inputs

**When to use:** Ensuring complete coverage of "what if" scenarios

**Example structure:**
```markdown
## Edge Case: Booking Conflicts During Polling

**What happens:** User A books 09:00 locally (optimistic update). Before API confirms, polling fetches update showing User B booked 09:00.

**Expected behavior:**
1. Polling replaces entire bookings state with server data
2. User A's optimistic booking is overwritten by User B's confirmed booking
3. No error shown to User A (silent rollback)
4. User A sees User B's booking appear

**Why this works:** Server is source of truth; last-write-wins at server level

**Warning sign:** If User A sees their booking flicker (appear then disappear), this is correct behavior
```

**Source:** [Use Case Specification Guideline](https://businessanalystmentor.com/use-case-specification-guidelines/), [BDD for Edge Cases](https://monday.com/blog/rnd/behavior-driven-development/)

### Pattern 5: State Transition Documentation

**What:** Document UI states and valid transitions between them

**When to use:** Complex UI components with multiple exclusive states

**Example structure:**
```markdown
## Booking Panel State Machine

**States:**
- CLOSED (panel hidden, no slot selected)
- USER_SELECTION (panel visible, awaiting user choice)
- DURATION_SELECTION (user chosen, awaiting duration)

**Transitions:**

| From State | Event | To State | Action |
|------------|-------|----------|--------|
| CLOSED | slot clicked (available) | USER_SELECTION | Open panel, clear previous selection |
| USER_SELECTION | user button clicked | DURATION_SELECTION | Highlight user, enable duration buttons |
| USER_SELECTION | ESC pressed | CLOSED | Close panel, clear selection |
| DURATION_SELECTION | duration button clicked | CLOSED | Create booking, close panel |
```

**Source:** [UML State Machine Tutorial](https://sparxsystems.com/resources/tutorials/uml2/state-diagram.html), [State Machine Documentation](https://www.embedded.com/software-design-of-state-machines/)

### Anti-Patterns to Avoid

- **Implementation details in behavior specs:** Don't say "useEffect fetches bookings" - say "System loads existing bookings on initial page load"
- **Vague error handling:** Don't say "handle errors gracefully" - specify exact rollback behavior
- **Missing decision criteria:** Don't say "button appears when appropriate" - list all conditions
- **Assuming obvious behavior:** Don't skip "obvious" edge cases like midnight boundaries or DST transitions
- **Technology coupling:** Don't reference React hooks, Rails models, or specific libraries - describe pure behavior

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time zone logic | Custom offset calculations | Document using IANA timezone names (Australia/Brisbane, Australia/Sydney) | DST rules change by legislation; IANA database is maintained |
| Decision table validation | Manual cross-checking | DMN hit policy notation (UNIQUE, FIRST, etc.) | Ensures no conflicting rules or gaps |
| Behavior specification syntax | Custom format | Given-When-Then (Gherkin) or decision tables | Standard formats are recognizable to AI and developers |
| State machine validation | Narrative description only | State transition table with all valid transitions listed | Prevents impossible states and orphaned transitions |

**Key insight:** Functional specifications benefit from standardized formats because:
1. **AI consumption:** Claude recognizes standard patterns (Gherkin, DMN tables, UML state diagrams)
2. **Testability:** Standard formats map directly to test frameworks (Cucumber, decision table testing)
3. **Completeness checking:** Tables reveal gaps (missing rows/columns) that prose hides

## Common Pitfalls

### Pitfall 1: Confusing Functional Behavior with Implementation

**What goes wrong:** Spec says "React hook polls API every 7 seconds" instead of "System synchronizes booking data every 7 seconds"

**Why it happens:** Documentation writer is too close to the React codebase

**How to avoid:**
- Use technology-neutral language: "System" not "Component", "User" not "onClick handler"
- Describe outcomes, not mechanisms: "Calendar updates when other users book" not "Polling hook triggers re-render"
- Ask: "Could a Rails developer implement this behavior without React knowledge?"

**Warning signs:**
- References to hooks, components, state variables in functional spec
- Saying "the code does X" instead of "the system does X"

### Pitfall 2: Incomplete Decision Coverage

**What goes wrong:** Decision table missing rows for valid combinations; implementer guesses wrong

**Why it happens:** Author documents happy path, assumes edge cases are "obvious"

**How to avoid:**
- Enumerate ALL condition combinations (use truth table if needed)
- For each combination, specify exact outcome
- Explicitly document "impossible" combinations (e.g., "Slot cannot be both available AND booked")

**Warning signs:**
- Decision table with fewer rows than combinations suggest
- Prose like "and similar cases" without listing them
- No documentation of boundary conditions (midnight, week boundaries, operating hour limits)

### Pitfall 3: Vague Edge Case Descriptions

**What goes wrong:** "Handle booking conflicts gracefully" - what does "gracefully" mean?

**Why it happens:** Author knows desired UX but doesn't spell it out

**How to avoid:**
- Specify exact behavior: "Show error message 'Slot already booked' for 3 seconds, then close panel"
- Document rollback/recovery: "On conflict, revert optimistic update and fetch server state"
- Include example data: "If User A books 09:00 duration 2, slots 09:00 and 10:00 become unavailable"

**Warning signs:**
- Words like "gracefully", "appropriately", "as expected" without definition
- "Handle edge cases" without listing specific cases
- No examples showing before/after state

### Pitfall 4: Missing "Why" Context

**What goes wrong:** Spec describes behavior but not rationale; implementer "improves" it incorrectly

**Why it happens:** Author assumes behavior is self-evident

**How to avoid:**
- Add "Because" or "Why" sections explaining constraints
- Document business rules behind technical behavior
- Explain tradeoffs: "We use polling instead of WebSockets because..."

**Warning signs:**
- Unusual behavior without explanation (e.g., "Book Now hidden when hour is current but booked")
- Arbitrary-seeming numbers without context (why 7 seconds? why 3 duration options?)

### Pitfall 5: State Machine Orphans

**What goes wrong:** State documented but no valid transition can reach it, or no way to exit it

**Why it happens:** Incremental documentation loses track of complete graph

**How to avoid:**
- List ALL states up front
- Create transition matrix (all states × all events)
- Verify every state is reachable from initial state
- Verify every state has exit path (or is explicitly terminal)

**Warning signs:**
- State mentioned once but never appears in transitions
- State with no incoming transitions (unreachable)
- Non-terminal state with no outgoing transitions (trap state)

## Code Examples

N/A - Functional documentation is technology-neutral prose/tables. However, here are annotation examples showing how to reference extracted code:

### Example: Referencing Business Logic from Extracted Code

```markdown
## Slot Status Calculation

**Behavior:** System determines if a time slot is available, booked, or blocked

**Logic:**
1. If slot has direct booking (booking starts at this hour): status = "booked"
2. Else if slot is inside another booking's range (multi-hour): status = "blocked"
3. Else: status = "available"

**Reference:** See `useBookings.js` lines 168-196 for React implementation pattern
**Extract:**
- "Booked" = booking exists at this exact time key
- "Blocked" = hour falls within another booking's (start hour) to (start hour + duration) range
- Blocking booking is included in result for UI to display

**Edge case:** If booking starts at 09:00 with duration 3:
- 09:00 = "booked" (booking.user = "Jack")
- 10:00 = "blocked" (booking.user = "Jack", references 09:00 start)
- 11:00 = "blocked" (booking.user = "Jack", references 09:00 start)
```

### Example: Decision Table from Boolean Logic

```markdown
## Book Now Button Visibility

**Inputs:**
- currentHourSlot: "available" | "booked" | "past"
- currentHourExists: boolean (is current hour within operating hours 6-21?)

**Output:** showBookNowButton: boolean

| currentHourExists | currentHourSlot | showBookNowButton | Reason |
|-------------------|----------------|-------------------|--------|
| true | "available" | TRUE | User can book current hour right now |
| true | "booked" | FALSE | Already booked by someone |
| true | "past" | FALSE | Current time past this hour |
| false | — | FALSE | Current hour outside operating hours (before 6 AM or after 9 PM) |

**Reference:** See `App.jsx` lines 215-235 for React implementation of this logic
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prose-only specs | Structured tables + prose | ~2015-2020 (BDD rise) | Tables reveal gaps prose hides |
| Implementation-coupled specs | Technology-neutral behavior specs | ~2020-2025 (multi-framework era) | Specs portable across React/Vue/Rails/etc |
| Manual testing checklists | Given-When-Then scenarios | ~2017-2023 (Cucumber adoption) | Specs become executable tests |
| Email/wiki specs | Version-controlled markdown | ~2018-2024 (docs-as-code) | Specs tracked alongside code in git |
| Ad-hoc edge case handling | Exhaustive edge case catalogs | ~2022-2026 (AI code generation) | AI needs complete specs, not "handle appropriately" |

**Deprecated/outdated:**
- **Word/PDF specifications:** Not version-controllable, not diff-able, not AI-friendly
- **"See code for details":** Defeats purpose of technology-neutral spec
- **UML-only behavior specs:** Diagrams without tables miss details; hybrid is better

**Current 2026 trend:** AI-optimized specifications use:
- Markdown tables (scannable by LLMs)
- Given-When-Then scenarios (maps to test generation)
- Exhaustive edge case catalogs (no "figure it out" gaps)
- Technology-neutral language (portable across stacks)

## Open Questions

None for standard functional documentation approaches. However, project-specific considerations:

1. **How detailed should time zone logic be?**
   - What we know: QLD storage, NSW display offset, DST detection needed
   - What's unclear: Should spec include IANA database references or just describe behavior?
   - Recommendation: Document behavior ("NSW shows +1h during DST") and reference IANA zones ("Australia/Sydney has DST, Australia/Brisbane does not")

2. **Should booking conflict resolution be specified?**
   - What we know: Last-write-wins at server, optimistic updates roll back on conflict
   - What's unclear: Should spec define race condition handling or just outcomes?
   - Recommendation: Document user-observable behavior (optimistic update → server rejects → silent rollback) without detailing server-side conflict resolution

3. **How to document keyboard shortcuts with dynamic keys?**
   - What we know: User hotkeys come from config (e.g., "Jack" → "j"), not hardcoded
   - What's unclear: Specify as table or as dynamic rule?
   - Recommendation: Both - table showing example config, plus rule "User hotkey = first letter of user.key field from config"

## Sources

### Primary (HIGH confidence)

**Functional Specification Best Practices:**
- [A Guide to Functional Requirements](https://www.nuclino.com/articles/functional-requirements) - Nuclino
- [Functional Specification Documents Guide](https://www.justinmind.com/blog/functional-specification-documentation-quick-guide-to-making-your-own/) - Justinmind
- [Guide to Functional Requirements](https://qat.com/guide-functional-requirements/) - QAT Global

**BDD and Behavior Specification:**
- [Behavior-Driven Development: Essential Guide for 2026](https://monday.com/blog/rnd/behavior-driven-development/) - Monday.com
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/) - Cucumber official docs
- [Writing Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/) - Cucumber official docs
- [Gherkin Scenarios Guide](https://www.browserstack.com/guide/gherkin-and-its-role-bdd-scenarios) - BrowserStack

**Decision Tables and Business Rules:**
- [DMN Specification (OMG)](https://www.omg.org/dmn/) - Object Management Group
- [DMN Business Rules and Decision Tables](https://www.solver.com/dmn-business-rules-decision-tables) - Solver
- [Decision Model and Notation](https://en.wikipedia.org/wiki/Decision_Model_and_Notation) - Wikipedia

**Workflow and Edge Case Documentation:**
- [Document Workflow Guide 2026](https://www.proprofskb.com/blog/workflow-documentation/) - ProProfs
- [Use Case Specification Guideline](https://businessanalystmentor.com/use-case-specification-guidelines/) - Business Analyst Mentor
- [Interactive Decision Trees](https://document360.com/blog/create-interactive-decision-trees/) - Document360

**State Machine Documentation:**
- [UML State Machine Tutorial](https://sparxsystems.com/resources/tutorials/uml2/state-diagram.html) - Sparx Systems
- [State Machine Documentation](https://www.embedded.com/software-design-of-state-machines/) - Embedded.com
- [UML State Machine](https://en.wikipedia.org/wiki/UML_state_machine) - Wikipedia

### Secondary (MEDIUM confidence)

**Project Management Context:**
- [Process Documentation Examples](https://usewhale.io/blog/process-documentation-examples/) - Whale
- [Best Practices for Documenting Workflows](https://osher.com.au/blog/best-practices-documenting-automated-workflows/) - Osher

### Tertiary (LOW confidence)

None - all sources verified through official documentation sites or established industry resources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Industry-standard patterns (BDD, DMN, UML state machines) with official specifications
- Architecture: HIGH - Clear document structure based on Phase 9 requirements (FUNC-01 through FUNC-05)
- Pitfalls: HIGH - Common specification mistakes documented across multiple authoritative sources
- Code examples: N/A - Functional specs are technology-neutral documentation, not executable code

**Research date:** 2026-02-13
**Valid until:** 60+ days - Functional specification practices are stable; formats like Gherkin, DMN tables, and state machines have been standard for 5-10+ years
