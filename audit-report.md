# SellScout Website — Bug & Issue Audit Report

> **Audit Scope:** Full-stack review of the SellScout app (React + Vite frontend, Hono + tRPC + Drizzle backend, Vercel deployment).  
> **Build Status:** `vite build` and `tsc -b` both pass without compile-time errors. The issues below are runtime bugs, architectural flaws, performance problems, and deployment risks.

---

## Table of Contents
1. [Critical — Will Break in Production](#critical--will-break-in-production)
2. [High — Severe Performance / Data Issues](#high--severe-performance--data-issues)
3. [Medium — UX Bugs, Logic Errors, Missing Features](#medium--ux-bugs-logic-errors-missing-features)
4. [Low — Code Quality, Cleanup, Dead Code](#low--code-quality-cleanup-dead-code)
5. [Security & Auth Issues](#security--auth-issues)
6. [Vercel Deployment Risks](#vercel-deployment-risks)

---

## Critical — Will Break in Production

### 1. tRPC API Route Mismatch on Vercel (API 404s)
**File:** `api/index.ts` vs `api/boot.ts`  
**Problem:** In local dev (`api/boot.ts`), the tRPC handler is mounted at `"/api/trpc/*"`. In the Vercel serverless entry (`api/index.ts`), it's mounted at `"/trpc/*"`. Vercel rewrites `"/api/trpc/..."` to `"/api/index"`, but Hono inside `api/index.ts` only matches `"/trpc/*"`, so **all tRPC requests will 404 on Vercel**.

**Fix:**
```typescript
// api/index.ts
app.use("/api/trpc/*", async (c) => {   // <-- was "/trpc/*"
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
```

---

### 2. React Router Package Duality (Potential Runtime Bugs)
**File:** `package.json`, `main.tsx`, `App.tsx`, `Navigation.tsx`, `Home.tsx`, `Footer.tsx`, `Pricing.tsx`  
**Problem:** Both `react-router` and `react-router-dom` are installed. `main.tsx` imports `BrowserRouter` from `react-router`, but `App.tsx` and page components import `Routes`, `Route`, `Link`, `useLocation` from `react-router-dom`. In v7, these should be compatible, but version mismatch (`^7.6.1` vs `^7.16.0`) and dual bundling can cause context mismatches, especially with hooks like `useNavigate`.

**Fix:** Consolidate to a single package. Since `react-router-dom` is the standard web entry, use it everywhere:
```typescript
// main.tsx
import { BrowserRouter } from "react-router-dom"; // not "react-router"
```
Then remove `"react-router"` from `dependencies` in `package.json` (or keep both versions perfectly in sync).

---

### 3. PostgreSQL Connection Leak in Serverless (Vercel)
**File:** `api/queries/connection.ts`  
**Problem:** The postgres client is created once and never closed. In Vercel's serverless environment, each invocation may hold the connection open until the lambda freezes, causing connection pool exhaustion under load.

**Fix:** Add a connection close helper and use it in serverless contexts, or switch to connectionless mode:
```typescript
export function closeDb() {
  if (client) {
    client.end();
    instance = undefined as any;
    client = undefined as any;
  }
}
```
For Vercel, also consider using `neon` or `pg` with `max: 1` pool config.

---

## High — Severe Performance / Data Issues

### 4. Three.js Geometry Clone Every Frame (Massive Memory Leak)
**File:** `src/pages/Home.tsx` (lines 117–118)  
**Problem:** Inside the `requestAnimationFrame` loop:
```typescript
const originalPos = geometry.attributes.position.clone().array as Float32Array;
```
This clones the entire vertex buffer (~500KB+) **every single frame** (60×/second). It causes severe GC pressure, stuttering, and eventually crashes the tab.

**Fix:** Store the original positions once outside the loop:
```typescript
// Inside useEffect, before animate():
const originalPositions = new Float32Array(geometry.attributes.position.array);

// In animate():
const posArray = posAttr.array as Float32Array;
for (let i = 0; i < posArray.length; i += 3) {
  const vx = originalPositions[i];
  const vy = originalPositions[i + 1];
  const vz = originalPositions[i + 2];
  // ... rest of deformation logic
}
```
Also, `geometry.computeVertexNormals()` is called every frame — cache it or call it only when displacement changes significantly.

---

### 5. StrictMode Double-Mount Wastes Three.js Resources
**File:** `src/main.tsx`  
**Problem:** `StrictMode` double-invokes effects in development. The Three.js cleanup disposes resources, but the initial mount creates a heavy scene before the cleanup fires, causing a noticeable performance hit on dev.

**Fix:** Keep `StrictMode` (it's good), but ensure the Three.js effect is idempotent and guards against rapid mount/unmount. The bigger issue is the `geometry.clone()` inside the loop (see #4).

---

### 6. Analytics Dashboard Returns Wrong `activeCampaigns` Count
**File:** `api/queries/analytics.ts` (line 14)  
**Problem:** `getDashboardMetrics` uses `count()` without filtering by `status = 'active'`, so it returns the total number of campaigns, not active ones.

**Fix:**
```typescript
import { eq, count } from "drizzle-orm";
// ...
activeCampaigns: count(
  sql`CASE WHEN ${campaigns.status} = 'active' THEN 1 END`
),
```

---

### 7. `dbToPlaybook` Silently Maps `archived` → `draft`
**File:** `src/pages/Playbooks.tsx` (line 48)  
**Problem:**
```typescript
status: db.status === 'archived' ? 'draft' : db.status,
```
This silently rewrites archived playbooks to draft status, confusing users and making the "archived" state unusable.

**Fix:** Add `'archived'` to the frontend `Playbook` type and `StatusBadge` component, or remove the mapping if archived playbooks should be hidden.

---

### 8. `StatusBadge` Missing `archived` Variant
**File:** `src/components/StatusBadge.tsx`  
**Problem:** The badge component does not define styles for `'archived'` status, causing a runtime crash if an archived status is ever passed (or just a missing style if mapped to draft).

**Fix:**
```typescript
const styles = {
  // ... existing
  archived: 'bg-white/[0.04] text-white/40',
};
const labels = {
  // ... existing
  archived: 'Archived',
};
```

---

## Medium — UX Bugs, Logic Errors, Missing Features

### 9. "Create Playbook" Button Does Nothing (No API Call)
**File:** `src/pages/Playbooks.tsx` (lines 161–164, 419)  
**Problem:** Clicking "Create Playbook" creates a local `id: 'new'` object and opens the editor, but `handleSave` shows a toast `"Create playbook via API"` and returns early. There is no actual `trpc.playbook.create` mutation call.

**Fix:** Wire up the create mutation:
```typescript
const createMutation = trpc.playbook.create.useMutation({
  onSuccess: (data) => {
    addToast('success', 'Playbook created');
    setEditingPlaybook(dbToPlaybook(data as any));
  },
  onError: (err) => addToast('error', err.message),
});

// In handleSave:
if (playbook.id === 'new') {
  createMutation.mutate({ name: form.name, ... });
  return;
}
```

---

### 10. Campaign Menu Actions Are All No-Ops
**File:** `src/pages/Campaigns.tsx` (lines 71–75)  
**Problem:** The dropdown menu in `CampaignRow` has buttons for "Duplicate", "Pause/Resume", "View Analytics", and "Delete" — none of them are wired to any mutation or handler. They are just static buttons with no `onClick` logic.

**Fix:** Import the relevant tRPC mutations and attach handlers:
```typescript
const deleteMutation = trpc.campaign.delete.useMutation({ ... });
const launchMutation = trpc.campaign.launch.useMutation({ ... });
// etc.
```

---

### 11. Misleading Reply Rate Arrow (No Baseline Comparison)
**File:** `src/pages/Campaigns.tsx` (line 60)  
**Problem:** Every campaign shows `↑` or `↓` next to reply rate, but there's no historical baseline to compare against. The arrow is purely based on a hardcoded `> 30` threshold, which is misleading analytics.

**Fix:** Remove the arrow or compare against the user's average reply rate across all campaigns, or against a prior time period.

---

### 12. Toast Auto-Dismiss Memory Leak
**File:** `src/hooks/useToast.tsx` (line 21)  
**Problem:** `setTimeout` is created but never cleared. If `removeToast(id)` is called before the 5-second timeout, the timeout still fires and tries to filter state, which can cause issues with React state batching.

**Fix:**
```typescript
const addToast = useCallback((type: ToastType, message: string) => {
  const id = Math.random().toString(36).slice(2);
  setToasts(prev => [...prev, { id, type, message }].slice(-3));
  const timer = setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, 5000);
  // Store timer in a ref map if you want to clear it on manual dismiss
}, []);
```

---

### 13. OAuth `state` Parameter Not CSRF-Safe
**File:** `src/pages/Login.tsx` (line 8)  
**Problem:** `const state = btoa(redirectUri);` is deterministic and predictable. An attacker can forge the state parameter and perform login CSRF.

**Fix:** Generate a random nonce, store it in `sessionStorage`, and verify it on callback:
```typescript
const state = crypto.randomUUID();
sessionStorage.setItem("oauth_state", state);
```

---

### 14. `AuthLayout` Is Dead Code with Broken Menu Items
**File:** `src/components/AuthLayout.tsx`  
**Problem:** `AuthLayout` is never used in the app. Its menu items are hardcoded to `"/some-path"` (which doesn't exist). It also redirects unauthenticated users via `window.location.href = LOGIN_PATH` (full page reload) instead of `navigate(LOGIN_PATH)`.

**Fix:** Either remove `AuthLayout` entirely, or integrate it properly and fix the menu items and navigation.

---

## Low — Code Quality, Cleanup, Dead Code

### 15. Unused Dependencies Inflate Bundle
**File:** `package.json`  
**Problem:** `next-themes` (Next.js-only), `mysql2` (unused, project uses `postgres`), and possibly `react-router` (if consolidating) are installed but unused. They bloat `node_modules` and can cause type conflicts.

**Fix:**
```bash
npm uninstall next-themes mysql2 react-router
```

---

### 16. `dotenv` Version is Bogus
**File:** `package.json` (`"dotenv": "^17.2.3"`)  
**Problem:** The latest stable `dotenv` is v16. v17 does not exist on npm. This would cause `npm install` to fail on a fresh machine. It likely only works because the lockfile resolves to something else or the package was already cached.

**Fix:**
```bash
npm install dotenv@^16.4.0
```

---

### 17. Browserslist DB is 6 Months Old
**Problem:** Vite build warns: `Browserslist: browsers data (caniuse-lite) is 6 months old.` This can cause suboptimal transpilation targets.

**Fix:**
```bash
npx update-browserslist-db@latest
```

---

### 18. `playbook.templateCount` and `campaignCount` Always Zero
**File:** `src/pages/Playbooks.tsx` (lines 68–69)  
**Problem:** These fields are hardcoded to `0` in `dbToPlaybook`. The UI shows them but they never have real values.

**Fix:** Add computed counts in the backend query or use Drizzle relations to count associated templates/campaigns.

---

### 19. Missing `key` Stability in Dynamic Lists
**File:** `src/pages/Playbooks.tsx` (value propositions, pain points), `src/pages/Campaigns.tsx` (sequence steps)  
**Problem:** Array items are keyed by index (`key={i}`). When items are deleted or reordered, React reuses DOM nodes incorrectly, causing input focus loss and stale state.

**Fix:** Use stable IDs:
```typescript
// For value propositions:
key={`vp-${i}-${vp.slice(0, 10)}`}
// Or better: assign a unique ID when adding items
```

---

### 20. No React Error Boundary
**Problem:** A single crash in any component (e.g., Three.js, Recharts, tRPC) will unmount the entire app and show a white screen.

**Fix:** Add an `ErrorBoundary` component and wrap routes:
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component { ... }

// App.tsx
<Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
```

---

## Security & Auth Issues

### 21. `sameSite: "None"` on Non-Localhost Without Explicit Consent
**File:** `api/lib/cookies.ts`  
**Problem:** On non-localhost, cookies are set with `sameSite: "None"` which allows cross-site cookie sending. Combined with OAuth flows, this increases CSRF surface area if other mitigations are missing.

**Fix:** Use `sameSite: "Lax"` for session cookies unless you have a verified cross-site iframe/embed use case. `sameSite: "None"` is only needed for embedded OAuth flows in iframes.

---

### 22. `ownerUnionId` Assignment Logic is Fragile
**File:** `api/queries/users.ts` (lines 23–29)  
**Problem:** If `env.ownerUnionId` is empty and a new user happens to have an undefined role, the logic doesn't assign "admin" correctly. Also, `ownerUnionId` comes from env and is empty by default (`""`), so the admin assignment is disabled.

**Fix:** Make `OWNER_UNION_ID` a required env var in production, or add a boot-time seed for the first admin user.

---

### 23. No Rate Limiting on tRPC / Auth Endpoints
**Problem:** The tRPC router and OAuth callback have no rate limiting. An attacker can brute-force the OAuth callback or flood the API.

**Fix:** Add Hono rate-limit middleware or use `hono-rate-limiter`.

---

## Vercel Deployment Risks

### 24. Missing Body Limit on Vercel API
**File:** `api/index.ts`  
**Problem:** `api/boot.ts` uses `bodyLimit({ maxSize: 50 * 1024 * 1024 })`, but `api/index.ts` has no body limit middleware. On Vercel, large requests could hit platform limits or cause memory issues.

**Fix:** Add `bodyLimit` to `api/index.ts`:
```typescript
import { bodyLimit } from "hono/body-limit";
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
```

---

### 25. `api/index.ts` Missing CORS for OAuth Callback
**File:** `vercel.json`  
**Problem:** CORS headers are only added to `/api/trpc/(.*)`. The OAuth callback (`/api/oauth/callback`) has no CORS headers, which may cause issues if the OAuth provider POSTs back to the endpoint or if the frontend is on a different origin during testing.

**Fix:** Add CORS headers to all `/api/*` routes or use Hono's `cors` middleware in `api/index.ts`.

---

### 26. Vercel `outputDirectory` Only Serves Static Files
**File:** `vercel.json`  
**Problem:** The `outputDirectory` is set to `dist/public`, but Vercel serverless functions are served from `api/*` and compiled independently. The build script (`npm run build`) outputs `dist/boot.js` which is never used by Vercel. This is fine if Vercel only needs the static frontend + serverless API, but the `dist/boot.js` build step is wasted compute.

**Fix:** Split build scripts or document that `npm run build` is for self-hosted Node.js, while Vercel uses the default Vite build + serverless API.

---

## Summary Checklist

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | tRPC route mismatch on Vercel | **Critical** | `api/index.ts` |
| 2 | React Router package duality | **Critical** | `package.json`, `main.tsx` |
| 3 | Postgres connection leak | **Critical** | `api/queries/connection.ts` |
| 4 | Three.js geometry clone every frame | **High** | `src/pages/Home.tsx` |
| 5 | StrictMode double-mount waste | **High** | `src/main.tsx` |
| 6 | Wrong `activeCampaigns` count | **High** | `api/queries/analytics.ts` |
| 7 | `archived` → `draft` data loss | **High** | `src/pages/Playbooks.tsx` |
| 8 | `StatusBadge` missing `archived` | **High** | `src/components/StatusBadge.tsx` |
| 9 | Create Playbook is a no-op | **Medium** | `src/pages/Playbooks.tsx` |
| 10 | Campaign menu actions are no-ops | **Medium** | `src/pages/Campaigns.tsx` |
| 11 | Misleading reply arrow | **Medium** | `src/pages/Campaigns.tsx` |
| 12 | Toast timeout leak | **Medium** | `src/hooks/useToast.tsx` |
| 13 | OAuth CSRF vulnerability | **Medium** | `src/pages/Login.tsx` |
| 14 | `AuthLayout` dead code | **Medium** | `src/components/AuthLayout.tsx` |
| 15 | Unused deps (`next-themes`, `mysql2`) | **Low** | `package.json` |
| 16 | Bogus `dotenv` version | **Low** | `package.json` |
| 17 | Old browserslist | **Low** | `package-lock.json` |
| 18 | `templateCount` / `campaignCount` always 0 | **Low** | `src/pages/Playbooks.tsx` |
| 19 | Unstable array keys | **Low** | `Playbooks.tsx`, `Campaigns.tsx` |
| 20 | No Error Boundary | **Low** | Global |
| 21 | `sameSite: "None"` security | **Medium** | `api/lib/cookies.ts` |
| 22 | `ownerUnionId` admin logic | **Low** | `api/queries/users.ts` |
| 23 | No rate limiting | **Medium** | `api/*` |
| 24 | Missing body limit on Vercel | **Medium** | `api/index.ts` |
| 25 | Missing CORS for OAuth | **Low** | `vercel.json` |
| 26 | Build script confusion | **Low** | `package.json`, `vercel.json` |

---

## Recommended Priority Order

1. **Fix #1 (tRPC Vercel route)** — Without this, the API is completely broken on deploy.
2. **Fix #4 (Three.js memory leak)** — Without this, the homepage crashes or freezes browsers.
3. **Fix #2 (Router consolidation)** — Prevents subtle navigation bugs.
4. **Fix #3 (DB connection leak)** — Prevents production outages under load.
5. **Fix #6, #7, #8 (Analytics & playbook data bugs)** — Fixes broken business logic.
6. **Fix #9, #10 (No-op buttons)** — Core features don't work.
7. **Fix #13 (OAuth CSRF)** — Security hardening before going live.
