# Phase 4: Deployment - Research

**Researched:** 2026-02-04
**Domain:** Git deployment, Vercel auto-deploy, manual repository sync
**Confidence:** HIGH

## Summary

Phase 4 deployment involves two distinct workflows: automatic deployment to 4 admin instances (via Vercel git integration) and manual sync to the booking-eureka instance (separate repository). The template repo (`boydclinton82/cps-calendar-book-form`) is connected to Vercel, which auto-deploys on push to main. The eureka instance uses a separate repo (`boydclinton82/eureka-whittaker-macnaught-booking`) requiring manual file copy and push.

This is a straightforward deployment phase with no new libraries or complex tooling. The workflow is well-understood from project documentation and standard Vercel/Git practices.

**Primary recommendation:** Push to template repo main branch, verify 4 admin deploys succeed, then manually sync changed files to eureka repo and push.

## Standard Stack

No new libraries required for deployment. Using existing tools:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Git | 2.x | Version control and push to remotes | Universal VCS |
| Vercel | N/A | Auto-deployment on git push | Already configured for project |
| GitHub | N/A | Remote repository hosting | Already hosts both repos |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `gh` CLI | GitHub operations | Optional - can verify deploy status |
| rsync/cp | File sync to eureka | Manual file copy operation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual copy | Git subtree/submodule | Over-engineered for low change frequency |
| Manual eureka sync | Automated sync script | Out of scope per REQUIREMENTS.md |

## Architecture Patterns

### Deployment Flow

```
Template Repo (cps-calendar-book-form)
        │
        ├── git push origin main
        │
        ▼
   Vercel Git Integration
        │
        ├── Auto-deploys 4 admin instances:
        │   ├── booking-bmo-financial-solutions.vercel.app
        │   ├── booking-eclipse.vercel.app
        │   ├── booking-nestworth.vercel.app
        │   └── booking-insight.vercel.app
        │
        └── (No connection to eureka)

Eureka Repo (eureka-whittaker-macnaught-booking)
        │
        ├── Manual copy changed files from template
        │
        ├── git add, commit, push
        │
        ▼
   Vercel Git Integration
        │
        └── Auto-deploys: booking-eureka.vercel.app
```

### Local Paths

| Repo | Local Path |
|------|------------|
| Template | `/Users/clintonweekes/Library/Mobile Documents/com~apple~CloudDocs/Documents/Software/cps-calendar-book-form` |
| Eureka | `/Users/clintonweekes/Library/Mobile Documents/com~apple~CloudDocs/Documents/Software/cps-calendar-dual` |

### Files Changed This Milestone

Based on git history, these files changed since the milestone started:

```
src/App.jsx               # Book Now handler, current hour availability
src/components/Header.jsx # Book Now button, styling
src/components/Header.css # Book Now cyberpunk styling
src/utils/time.js         # isSlotPast() fix, timezone utilities (Phase 3)
```

**Note:** Phase 3 (Timezone Display) will add more changes. Final file list must be determined at deployment time.

### Pattern: Manual Sync Protocol

**What:** Copy specific changed files from template to eureka repo
**When to use:** After template changes are committed and pushed
**Example:**
```bash
# Identify changed files
git diff --name-only HEAD~N HEAD -- src/ api/

# Copy each changed file (preserving directory structure)
cp src/App.jsx /path/to/eureka/src/App.jsx
cp src/components/Header.jsx /path/to/eureka/src/components/Header.jsx
# ... etc

# Commit and push eureka
cd /path/to/eureka
git add .
git commit -m "Sync changes from template repo"
git push origin main
```

### Anti-Patterns to Avoid
- **Full repo copy:** Don't copy entire repo - eureka has different instance config
- **Direct file editing in eureka:** Always change template first, then sync
- **Pushing to wrong remote:** Double-check which repo you're in before push
- **Forgetting to verify deploys:** Always confirm deployments succeeded

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-deploy | CI/CD scripts | Vercel git integration | Already configured, zero maintenance |
| Deploy status | Custom monitoring | Vercel dashboard | Shows build logs, errors, timing |
| File diff | Manual comparison | `git diff --name-only` | Accurate list of changed files |
| Eureka sync | Complex sync script | Manual copy | Low frequency, not worth automation per requirements |

**Key insight:** This deployment is intentionally simple. The admin instances auto-deploy. The eureka sync is manual by design (see REQUIREMENTS.md: "Automatic Eureka sync - Manual sync acceptable given low change frequency").

## Common Pitfalls

### Pitfall 1: Pushing Before Phase 3 Complete
**What goes wrong:** Deploying partial changes
**Why it happens:** Eager to see changes live
**How to avoid:** Verify Phase 3 is complete (all tests passing, code reviewed)
**Warning signs:** ROADMAP.md shows Phase 3 incomplete

### Pitfall 2: Forgetting Eureka Sync
**What goes wrong:** Eureka instance stays on old code
**Why it happens:** Auto-deploy for admin instances creates false sense of "done"
**How to avoid:** Deployment plan explicitly includes eureka sync as required step
**Warning signs:** Eureka URL shows old behavior

### Pitfall 3: Wrong Files Synced to Eureka
**What goes wrong:** Missing files or copying wrong versions
**Why it happens:** Manual process is error-prone
**How to avoid:** Use `git diff --name-only` to get authoritative file list, verify each copy
**Warning signs:** Eureka build fails or behaves differently than admin instances

### Pitfall 4: Environment Variable Mismatch
**What goes wrong:** New feature requires env var not set in eureka
**Why it happens:** Admin instances configured via admin app, eureka configured separately
**How to avoid:** Check if any new env vars added this milestone (none expected for Phase 1-3)
**Warning signs:** Eureka runtime errors about missing config

### Pitfall 5: Not Verifying Deploys
**What goes wrong:** Deploy silently fails, users see old code
**Why it happens:** Assuming git push = successful deploy
**How to avoid:** Check Vercel dashboard or visit each URL after push
**Warning signs:** Changes not visible on live URLs

## Code Examples

### Check Changed Files Since Milestone Start
```bash
# From template repo root
cd "/Users/clintonweekes/Library/Mobile Documents/com~apple~CloudDocs/Documents/Software/cps-calendar-book-form"

# List all files changed in src/ and api/ (deployment-relevant files)
git diff --name-only HEAD~20 HEAD -- src/ api/
```

### Push to Template Repo
```bash
# Ensure on main branch
git checkout main

# Push to trigger auto-deploy
git push origin main
```

### Sync Files to Eureka
```bash
# Template paths
TEMPLATE="/Users/clintonweekes/Library/Mobile Documents/com~apple~CloudDocs/Documents/Software/cps-calendar-book-form"
EUREKA="/Users/clintonweekes/Library/Mobile Documents/com~apple~CloudDocs/Documents/Software/cps-calendar-dual"

# Copy changed files (example - actual list determined at execution)
cp "$TEMPLATE/src/App.jsx" "$EUREKA/src/App.jsx"
cp "$TEMPLATE/src/components/Header.jsx" "$EUREKA/src/components/Header.jsx"
cp "$TEMPLATE/src/components/Header.css" "$EUREKA/src/components/Header.css"
cp "$TEMPLATE/src/utils/time.js" "$EUREKA/src/utils/time.js"

# Commit and push eureka
cd "$EUREKA"
git add -A
git commit -m "Sync: Universal Booking Improvements (Phase 1-3)

- Fix current hour slot visibility (isSlotPast)
- Add Book Now button for quick booking
- Add NSW timezone toggle

Synced from boydclinton82/cps-calendar-book-form"
git push origin main
```

### Verify Deployment Status
```bash
# Option 1: Open Vercel dashboard
open "https://vercel.com/boydclinton82"

# Option 2: Quick curl check (returns 200 if site up)
curl -s -o /dev/null -w "%{http_code}" https://booking-eclipse.vercel.app
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Vercel deploy | Git-triggered auto-deploy | Already configured | Zero-touch deploy on push |
| Eureka on same repo | Eureka in separate repo | Historical | Requires manual sync |

**Deprecated/outdated:**
- None - deployment approach is stable and appropriate for project scale

## Open Questions

No significant open questions. This is a well-understood deployment pattern.

1. **Phase 3 file changes**
   - What we know: Phase 3 will likely modify `src/utils/time.js` and potentially other files
   - What's unclear: Exact list of files until Phase 3 completes
   - Recommendation: Determine final file list at plan execution time using `git diff`

## Sources

### Primary (HIGH confidence)
- Project documentation: `.planning/CONTEXT.md` - Deployment architecture details
- Project documentation: `.planning/PROJECT.md` - Multi-instance deployment info
- Project documentation: `.planning/codebase/INTEGRATIONS.md` - Vercel deployment config
- Direct verification: Git remotes and local paths confirmed via bash

### Secondary (MEDIUM confidence)
- [Vercel for GitHub Docs](https://vercel.com/docs/git/vercel-for-github) - Auto-deployment on push
- [GitHub Syncing a Fork](https://docs.github.com/articles/syncing-a-fork) - Git sync patterns

### Tertiary (LOW confidence)
- None - all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Deployment workflow: HIGH - Verified from project documentation and git config
- File sync process: HIGH - Local paths verified, process documented
- Pitfalls: HIGH - Based on manual sync anti-patterns and project constraints

**Research date:** 2026-02-04
**Valid until:** Indefinite - deployment infrastructure is stable
