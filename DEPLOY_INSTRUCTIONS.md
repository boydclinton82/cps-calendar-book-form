# Deploy to GitHub + Vercel Instructions

**Purpose**: This file instructs Claude Code to securely deploy this local project to GitHub and Vercel. Add this file to any project and reference it in planning mode.

**Usage**: In Claude Code, say: "Read @DEPLOY_INSTRUCTIONS.md and deploy this project"

---

## Owner Details

| Item | Value |
|------|-------|
| **GitHub Username** | boydclinton82 |
| **Vercel Account** | clinton-clintonweekes-projects |
| **Vercel Dashboard** | https://vercel.com/clinton-clintonweekes-projects |
| **GitHub Profile** | https://github.com/boydclinton82 |
| **GitHub Noreply Email** | 217532423+boydclinton82@users.noreply.github.com |

### CLI Authentication Notes
- **GitHub CLI**: Run `gh auth login` if not authenticated. Use web browser flow.
- **Vercel CLI**: Run `vercel login` if not authenticated. Links to clinton-clintonweekes-projects account.
- Both CLIs should already be installed. If not, prompt user to install: `npm i -g vercel` and `brew install gh`

### Git Author Configuration (CRITICAL)
Vercel CLI validates that the git commit author email has access to the Vercel team. **Before deploying**, ensure git is configured:

```bash
# Set git email to GitHub noreply (required for Vercel deploys)
git config user.email "217532423+boydclinton82@users.noreply.github.com"
git config user.name "Clinton Weekes"
```

If you see error "Git author must have access to the team", this is the fix.

### Important Workflow Notes
- **Do NOT run dev servers** (npm run dev, npm start, etc.) directly in Claude Code. Prompt the user when testing is needed so they can run servers in a separate terminal.
- **Prompt user for sensitive values**: When adding environment variables, don't guess - ask the user to provide API keys.

---

## Phase 1: Security Audit (MANDATORY)

Before any deployment, perform a comprehensive security review. Check for and fix:

### 1.1 API Keys & Secrets
- [ ] All API keys/secrets are in `.env` (not hardcoded)
- [ ] `.env` is in `.gitignore`
- [ ] No secrets in console.log statements
- [ ] No secrets exposed in error messages
- [ ] Health endpoints don't reveal API key presence/status

### 1.2 Input Validation & Sanitization
- [ ] All user inputs are validated (length limits, type checking)
- [ ] HTML/script tags are stripped from inputs
- [ ] Special characters are escaped where needed
- [ ] SQL injection protection (if using database)
- [ ] Path traversal protection (if handling file paths)

### 1.3 Rate Limiting
- [ ] API endpoints have rate limiting (recommend 10-60 req/min per IP)
- [ ] Use in-memory store for serverless (Map with TTL cleanup)
- [ ] Return 429 status with clear message when limit exceeded

### 1.4 CORS Configuration
- [ ] CORS is NOT set to `*` in production
- [ ] Whitelist only: `*.vercel.app`, `localhost` (for dev)
- [ ] Custom domains added if applicable

### 1.5 Security Headers
Add these headers to all API responses:
```javascript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
```

### 1.6 Error Handling
- [ ] Generic error messages to clients (no stack traces)
- [ ] Detailed errors only in server logs
- [ ] No internal paths or system info exposed

### 1.7 Dependencies
- [ ] Run `npm audit` and fix critical/high vulnerabilities
- [ ] Remove unused dependencies
- [ ] Check for outdated packages with known CVEs

---

## Phase 2: Prepare for Vercel Deployment

### 2.1 Determine Project Type

**Static/Frontend Only** (React, Vue, plain HTML):
- No backend conversion needed
- Just configure build output

**Full-Stack with Express/Node Backend**:
- Convert Express routes to Vercel serverless functions
- Create `api/` directory for serverless functions
- Keep original `server/` for local development

### 2.2 Create Vercel Serverless Structure (if backend exists)

Convert this structure:
```
server/
├── index.js
├── routes/
│   └── myroute.js
└── services/
    └── myservice.js
```

To this:
```
api/
├── myroute.js          # Serverless function (POST/GET /api/myroute)
├── health.js           # Health check endpoint
└── _lib/               # Shared code (underscore = not exposed as endpoint)
    ├── myservice.js    # Business logic
    └── security.js     # Rate limiting, CORS, headers
```

### 2.3 Serverless Function Template

Create `api/_lib/security.js`:
```javascript
// Rate limiting store (in-memory for serverless)
const rateLimitStore = new Map();

export function rateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs };

  if (current.resetTime < now) {
    current.count = 1;
    current.resetTime = now + windowMs;
  } else {
    current.count++;
  }

  rateLimitStore.set(ip, current);
  return current.count <= limit;
}

export function sanitizeInput(input, maxLength = 200) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')           // Strip HTML
    .replace(/[<>"'&]/g, '')           // Remove dangerous chars
    .trim()
    .slice(0, maxLength);
}

export function getCorsHeaders(origin) {
  const allowed = [
    /^https?:\/\/localhost(:\d+)?$/,
    /\.vercel\.app$/
  ];

  const isAllowed = allowed.some(pattern => pattern.test(origin || ''));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };
}
```

Example serverless function `api/myroute.js`:
```javascript
import { rateLimit, sanitizeInput, getCorsHeaders } from './_lib/security.js';
import { myService } from './_lib/myservice.js';

export default async function handler(req, res) {
  const headers = getCorsHeaders(req.headers.origin);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const input = sanitizeInput(req.body?.input);
    if (!input) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const result = await myService(input);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}
```

### 2.4 Create vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "installCommand": "npm install",
  "functions": {
    "api/*.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

**Adjust for your project**:
- `outputDirectory`: Where your built frontend lives (e.g., `dist`, `build`, `client/dist`)
- `buildCommand`: Your build script (e.g., `npm run build`, `vite build`)
- Remove `rewrites` if no SPA routing needed

---

## Phase 3: Git & GitHub Setup

### 3.1 Initialize Git (if not already)
```bash
git init
```

### 3.2 Create/Update .gitignore
Ensure these are included:
```
node_modules/
.env
.env.local
.env.*.local
dist/
build/
.DS_Store
*.log
```

### 3.3 Create GitHub Repository
```bash
# Authenticate if needed (use web browser flow)
gh auth login

# Create private repo under boydclinton82 account and push
# Replace PROJECT_NAME with your actual project name
gh repo create PROJECT_NAME --private --source=. --push

# This will create: https://github.com/boydclinton82/PROJECT_NAME
```

---

## Phase 4: Deploy to Vercel

### 4.1 Initial Deployment
```bash
# Deploy to production (deploys to clinton-clintonweekes-projects account)
vercel --prod

# If prompted for scope/team, select: clinton-clintonweekes-projects
# If first time, you may need: vercel login
```

### 4.2 Add Environment Variables
```bash
# For each env var needed:
vercel env add VARIABLE_NAME production

# Common ones:
# - API keys (YOUTUBE_API_KEY, ANTHROPIC_API_KEY, etc.)
# - Database URLs
# - Third-party service credentials

# Prompt the user to enter the actual values when adding env vars
# The user will paste them interactively
```

### 4.3 Disable Deployment Protection (for personal projects)
1. Go to https://vercel.com/clinton-clintonweekes-projects/PROJECT_NAME/settings
2. Deployment Protection → Disable "Vercel Authentication"
3. This allows public access without Vercel login

### 4.4 Verify Deployment
```bash
# The deployed URL will be shown after vercel --prod completes
# Format: https://PROJECT_NAME-HASH-clinton-clintonweekes-projects.vercel.app

# Test health endpoint (if you created one)
curl https://YOUR_DEPLOYED_URL/api/health

# Test main functionality
curl -X POST https://YOUR_DEPLOYED_URL/api/YOUR_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## Phase 5: Post-Deployment Checklist

- [ ] App loads correctly at Vercel URL
- [ ] API endpoints return expected responses
- [ ] Rate limiting works (test with rapid requests)
- [ ] CORS blocks unauthorized origins
- [ ] Environment variables are working
- [ ] No secrets exposed in browser console/network tab
- [ ] Error responses don't leak internal details

---

## Quick Reference: Common Vercel Issues

| Issue | Solution |
|-------|----------|
| 429 Too Many Requests | Rate limiting active - wait 1 minute |
| CORS errors | Update allowed origins in security.js |
| Env vars not working | Redeploy after adding: `vercel --prod` |
| Deployment protection blocking | Disable in Vercel Dashboard settings |
| Build fails | Check `outputDirectory` matches your build output |
| API 404 | Ensure `api/` folder is at project root |
| Git author access error | Set git email: `git config user.email "217532423+boydclinton82@users.noreply.github.com"` |

---

## Redeployment

**Automatic** (recommended): Push to GitHub and Vercel auto-deploys
```bash
git add .
git commit -m "Your changes"
git push

# Vercel watches the GitHub repo and auto-deploys on push
# Check status at: https://vercel.com/clinton-clintonweekes-projects/PROJECT_NAME
```

**Manual**:
```bash
vercel --prod
```

### Link GitHub to Vercel (if not auto-linked)
If auto-deploy isn't working:
1. Go to https://vercel.com/clinton-clintonweekes-projects/PROJECT_NAME/settings/git
2. Connect to GitHub repo: boydclinton82/PROJECT_NAME
3. Enable "Auto-deploy" on push to main branch

**Via CLI**:
```bash
vercel git connect https://github.com/boydclinton82/PROJECT_NAME --yes
```

---

## Cost Notes

| Service | Free Tier |
|---------|-----------|
| **Vercel** | 100GB bandwidth, serverless functions included |
| **GitHub** | Unlimited private repos |

---

## Summary for Claude Code Instances

When reading this file, you should:
1. Run the security audit FIRST - fix all issues found before deployment
2. Convert backend to serverless if the project has an Express/Node server
3. Create GitHub repo under `boydclinton82` account
4. Deploy to Vercel under `clinton-clintonweekes-projects` account
5. Prompt the user for any API keys/secrets needed for env vars
6. Verify the deployment works before marking complete

*This file is designed for Clinton Weekes' personal projects. Copy to any project that needs deployment.*
