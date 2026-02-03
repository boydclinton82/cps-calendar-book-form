# Technology Stack

**Analysis Date:** 2026-02-04

## Languages

**Primary:**
- JavaScript (ES2020+) - Frontend components, hooks, utilities
- JavaScript (ES2020+) - Backend API endpoints (Node.js serverless)

## Runtime

**Environment:**
- Node.js (Vercel serverless runtime)
- Browser (modern browsers supporting ES2020+)

**Package Manager:**
- npm (^9.0.0 implied by vite ^6.0.5)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 18.3.1 - UI framework for components and state management
- Vite 6.0.5 - Build tool and dev server
- @vitejs/plugin-react 4.3.4 - Fast refresh and JSX transformation

**Backend:**
- Vercel Serverless Functions - HTTP API endpoints (Vercel platform native)

## Key Dependencies

**Critical:**
- @vercel/kv 3.0.0 - Redis client for data storage via Vercel KV service
  - Used for persisting bookings and configuration data
  - Namespaced by INSTANCE_SLUG for multi-tenant deployment
  - REST API and direct Redis protocol both supported

**Development:**
- eslint 9.17.0 - Code linting
- @types/react 18.3.18 - TypeScript type definitions for React
- @types/react-dom 18.3.5 - TypeScript type definitions for React DOM
- @eslint/js 9.17.0 - ESLint core rules
- eslint-plugin-react-hooks 5.0.0 - React-specific linting rules
- eslint-plugin-react-refresh 0.4.16 - React Fast Refresh linting
- globals 15.14.0 - Global variable definitions for linting

## Configuration

**Environment Variables:**
- `VITE_USE_API` - Boolean flag to enable/disable API backend ("true"/"false")
  - When "false", falls back to localStorage
  - Frontend only (prefixed with VITE_)

- `INSTANCE_SLUG` - Tenant identifier for multi-instance deployment
  - Default: "cps-software"
  - Used to namespace KV storage keys (e.g., "instance:{slug}:bookings")
  - Can be overridden per deployment

- `KV_REST_API_URL` - Vercel KV REST endpoint
  - Format: https://{region}.kv.vercel-storage.com or Upstash REST URL
  - Backend only (server-side)

- `KV_REST_API_TOKEN` - Authentication token for Vercel KV REST API
  - Backend only (server-side)
  - Set by Vercel deployment environment

**Build Configuration:**
- `vite.config.js` - Vite build and dev configuration
  - React plugin enabled
  - Dev server allows any host (`allowedHosts: true`)

- `vercel.json` - Vercel platform deployment configuration
  - API function memory: 128 MB
  - API function timeout: 10 seconds
  - Rewrites configure SPA routing and API passthrough

## Platform Requirements

**Development:**
- Node.js (version supporting ES2020+)
- npm package manager
- Modern browser with ES2020+ support

**Production:**
- Vercel platform (serverless functions + static hosting)
- Vercel KV service (Redis-based storage)
- Custom domain or Vercel default domain

## Deployment Pipeline

**Build Command:**
```bash
npm run build  # Outputs dist/ directory
```

**Preview Command:**
```bash
npm run preview  # Local testing of built output
```

**Development Command:**
```bash
npm run dev  # Vite dev server with hot module replacement
```

**Linting:**
```bash
npm run lint  # ESLint check
```

---

*Stack analysis: 2026-02-04*
