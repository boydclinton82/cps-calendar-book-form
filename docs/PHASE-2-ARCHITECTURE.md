# Phase 2: Multi-Instance Architecture

## Overview

Transform the single-instance prototype into a scalable multi-instance system with admin management, real-time data sync via Vercel KV, and a deployment workflow.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN APP                                │
│                  (admin.cps-calendar.vercel.app)                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Instance Wizard                                           │ │
│  │  - Create new instance (name, users, colors)               │ │
│  │  - Generate deployment config                              │ │
│  │  - Manage existing instances                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Creates config in
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL KV (Redis)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  instance:eclipse-financial                                │ │
│  │  ├── config: { title, users: [...], colors: {...} }       │ │
│  │  └── bookings: { "2024-01-21": { "10:00": {...} } }       │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  instance:acme-corp                                        │ │
│  │  ├── config: { title, users: [...], colors: {...} }       │ │
│  │  └── bookings: { ... }                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Instance: A     │ │ Instance: B     │ │ Instance: C     │
│ eclipse.vercel  │ │ acme.vercel.app │ │ xyz.vercel.app  │
│                 │ │                 │ │                 │
│ Polls KV every  │ │ Polls KV every  │ │ Polls KV every  │
│ 5-10 seconds    │ │ 5-10 seconds    │ │ 5-10 seconds    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Data Model

### Instance Configuration

Stored in Vercel KV at key `instance:{slug}:config`

```typescript
interface InstanceConfig {
  slug: string;           // URL-safe identifier (e.g., "eclipse-financial")
  title: string;          // Display title (e.g., "Eclipse Financial Solutions - xplan")
  users: User[];          // 2-4 users
  colors: ColorConfig;    // User color assignments
  createdAt: string;      // ISO date
  updatedAt: string;      // ISO date
}

interface User {
  name: string;           // Display name (e.g., "Jack")
  key: string;            // Hotkey (e.g., "j")
}

interface ColorConfig {
  user1: "green";         // First user always green
  user2: "red";           // Second user always red
  user3?: "purple";       // Third user (optional)
  user4?: "orange";       // Fourth user (optional)
}
```

### Bookings Data

Stored in Vercel KV at key `instance:{slug}:bookings`

```typescript
interface BookingsData {
  [dateKey: string]: {              // "2024-01-21"
    [timeKey: string]: Booking;     // "10:00"
  };
}

interface Booking {
  user: string;           // User name
  duration: number;       // 1, 2, or 3 hours
  createdAt?: string;     // ISO date (optional, for audit)
}
```

---

## Vercel KV Setup

### Environment Variables (per instance)

```env
# Vercel KV connection (shared across all instances)
KV_REST_API_URL=https://xxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxx

# Instance identifier
INSTANCE_SLUG=eclipse-financial
```

### API Routes

Create serverless functions in `/api` directory:

```
/api/
├── config.js          # GET instance config
├── bookings/
│   ├── index.js       # GET all bookings, POST new booking
│   ├── [date].js      # GET bookings for specific date
│   └── update.js      # PUT update booking, DELETE booking
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET | Get instance configuration |
| `/api/bookings` | GET | Get all bookings |
| `/api/bookings` | POST | Create new booking |
| `/api/bookings/[date]` | GET | Get bookings for specific date |
| `/api/bookings/update` | PUT | Update existing booking |
| `/api/bookings/update` | DELETE | Delete booking |

### Polling Strategy

```javascript
// usePollingSync.js
const POLL_INTERVAL = 7000; // 7 seconds

export function usePollingSync(onUpdate) {
  useEffect(() => {
    const poll = async () => {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      onUpdate(data);
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    poll(); // Initial fetch

    return () => clearInterval(interval);
  }, [onUpdate]);
}
```

---

## Admin App

### Features

1. **Instance List**: View all configured instances
2. **Create Wizard**: Step-by-step instance creation
3. **Edit Instance**: Modify users, colors, title
4. **Delete Instance**: Remove instance and all data

### Wizard Flow

```
Step 1: Basic Info
┌─────────────────────────────────────────────┐
│  Create New Instance                        │
│                                             │
│  Instance Name                              │
│  ┌─────────────────────────────────────┐   │
│  │ Eclipse Financial Solutions         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Slug (auto-generated, URL-safe)            │
│  ┌─────────────────────────────────────┐   │
│  │ eclipse-financial-solutions         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Subtitle (optional)                        │
│  ┌─────────────────────────────────────┐   │
│  │ xplan                                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                          [Next →]           │
└─────────────────────────────────────────────┘

Step 2: Users
┌─────────────────────────────────────────────┐
│  Configure Users (2-4)                      │
│                                             │
│  User 1 (Green)                             │
│  ┌────────────────────┐ ┌───────┐          │
│  │ Jack               │ │ J     │ ← Hotkey │
│  └────────────────────┘ └───────┘          │
│                                             │
│  User 2 (Red)                               │
│  ┌────────────────────┐ ┌───────┐          │
│  │ Bonnie             │ │ B     │          │
│  └────────────────────┘ └───────┘          │
│                                             │
│  User 3 (Purple) - Optional                 │
│  ┌────────────────────┐ ┌───────┐          │
│  │                    │ │       │          │
│  └────────────────────┘ └───────┘          │
│                                             │
│  [+ Add User]                               │
│                                             │
│  [← Back]                    [Next →]       │
└─────────────────────────────────────────────┘

Step 3: Review & Deploy
┌─────────────────────────────────────────────┐
│  Review Configuration                       │
│                                             │
│  Title: Eclipse Financial Solutions - xplan │
│  Slug: eclipse-financial-solutions          │
│                                             │
│  Users:                                     │
│  • Jack (J) - Green                         │
│  • Bonnie (B) - Red                         │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Deployment Instructions:                   │
│                                             │
│  1. Fork the template repository            │
│  2. Deploy to Vercel                        │
│  3. Add these environment variables:        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ INSTANCE_SLUG=eclipse-financial...  │   │
│  │ KV_REST_API_URL=...                 │   │
│  │ KV_REST_API_TOKEN=...               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [← Back]              [Create Instance]    │
└─────────────────────────────────────────────┘
```

### Admin Authentication

Simple password protection for the admin app:

```javascript
// Middleware: Check admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return false;
  }
  return true;
}
```

---

## Color System

### CSS Variables (per user position)

```css
:root {
  /* User 1 - Green */
  --user-1-color: rgb(34, 197, 94);
  --user-1-glow: rgba(34, 197, 94, 0.4);
  --user-1-glow-strong: rgba(34, 197, 94, 0.6);

  /* User 2 - Red */
  --user-2-color: rgb(220, 38, 38);
  --user-2-glow: rgba(220, 38, 38, 0.4);
  --user-2-glow-strong: rgba(220, 38, 38, 0.6);

  /* User 3 - Purple */
  --user-3-color: rgb(147, 51, 234);
  --user-3-glow: rgba(147, 51, 234, 0.4);
  --user-3-glow-strong: rgba(147, 51, 234, 0.6);

  /* User 4 - Orange */
  --user-4-color: rgb(249, 115, 22);
  --user-4-glow: rgba(249, 115, 22, 0.4);
  --user-4-glow-strong: rgba(249, 115, 22, 0.6);
}
```

### Dynamic Color Assignment

```javascript
// utils/colors.js
export function getUserColor(userName, config) {
  const userIndex = config.users.findIndex(u => u.name === userName);
  return `var(--user-${userIndex + 1}-color)`;
}

export function getUserGlow(userName, config) {
  const userIndex = config.users.findIndex(u => u.name === userName);
  return `var(--user-${userIndex + 1}-glow)`;
}
```

---

## Dynamic Title

### Header Component Update

```jsx
// Header.jsx
export function Header({ config, currentDate, onNavigate, isWeekView }) {
  // config.title = "Eclipse Financial Solutions - xplan"

  return (
    <header className="header">
      <h1 className="app-title">{config.title}</h1>
      {/* ... rest of header */}
    </header>
  );
}
```

### Title Format

Single line, dynamic based on instance config:
- Format: `{Company Name} - {Subtitle}`
- Example: "Eclipse Financial Solutions - xplan"
- If no subtitle: just company name

---

## Deployment Workflow

### Template Repository Structure

```
cps-calendar-template/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── App.jsx
├── api/
│   ├── config.js
│   └── bookings/
├── vercel.json
├── package.json
└── README.md
```

### Deployment Steps

1. **Admin creates instance** via wizard
   - Config saved to shared Vercel KV

2. **Deploy new Vercel project**
   - Fork/import from template repo
   - Configure environment variables:
     - `INSTANCE_SLUG`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`

3. **Instance reads config on load**
   - Fetches from `/api/config`
   - Applies title, users, colors

4. **Polling begins**
   - Every 7 seconds, fetch `/api/bookings`
   - Update local state with any changes

### vercel.json

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 128,
      "maxDuration": 10
    }
  }
}
```

---

## Implementation Checklist

### Vercel KV Integration
- [ ] Set up Vercel KV database
- [ ] Create `/api/config.js` endpoint
- [ ] Create `/api/bookings/index.js` endpoint
- [ ] Create `/api/bookings/update.js` endpoint
- [ ] Implement `usePollingSync` hook
- [ ] Replace localStorage with KV API calls
- [ ] Test real-time sync between browsers

### Dynamic Configuration
- [ ] Create `useConfig` hook to fetch config
- [ ] Update Header to use dynamic title
- [ ] Update useKeyboard to use dynamic users
- [ ] Update color system for 4 users
- [ ] Test dynamic user/color assignment

### Admin App
- [ ] Create separate Vercel project for admin
- [ ] Implement password protection
- [ ] Create instance list page
- [ ] Create wizard: Step 1 (basic info)
- [ ] Create wizard: Step 2 (users)
- [ ] Create wizard: Step 3 (review/deploy)
- [ ] Create edit instance functionality
- [ ] Create delete instance functionality
- [ ] Test full wizard flow

### Template Repository
- [ ] Extract reusable template from prototype
- [ ] Add API routes
- [ ] Create README with deployment instructions
- [ ] Test deployment from template

---

## Testing Plan

### API Testing

```bash
# Test config endpoint
curl https://your-instance.vercel.app/api/config

# Test bookings endpoint
curl https://your-instance.vercel.app/api/bookings

# Test create booking
curl -X POST https://your-instance.vercel.app/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-21","time":"10:00","user":"Jack","duration":2}'

# Test update booking
curl -X PUT https://your-instance.vercel.app/api/bookings/update \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-21","time":"10:00","user":"Bonnie","duration":1}'

# Test delete booking
curl -X DELETE https://your-instance.vercel.app/api/bookings/update \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-21","time":"10:00"}'
```

### Real-Time Sync Testing

1. Open instance in two browser windows
2. Create booking in window A
3. Verify booking appears in window B within 10 seconds
4. Edit booking in window B
5. Verify change appears in window A within 10 seconds
6. Delete booking in window A
7. Verify deletion in window B within 10 seconds

### Admin Wizard Testing

1. Access admin app with password
2. Click "Create Instance"
3. Enter company name and subtitle
4. Add 3 users with hotkeys
5. Review configuration
6. Create instance
7. Verify config stored in KV
8. Deploy new instance
9. Verify instance loads correct config

---

## Security Considerations

### API Authentication

For production, consider adding:
- API key authentication for instance APIs
- Rate limiting on API endpoints
- Input validation and sanitization

### Admin App

- Password should be strong and unique
- Consider adding 2FA for production
- Log admin actions for audit trail

### Data Privacy

- No personal data stored beyond user names
- Bookings only contain name + duration
- No analytics or tracking built-in
