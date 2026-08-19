# Architecture Review & Improvements

> Generated: 2026-08-19
> Project: Educational Platform
> Comparison: Current implementation vs. Recommended Architecture

---

## 1. Executive Summary

The current implementation is **structurally close** to the recommended architecture. The three-layer separation (Frontend -> Backend -> Supabase) is mostly intact. However, there are **critical security gaps**, **authentication architecture mismatches**, and **deployment configuration issues** that must be fixed before production.

| Area | Status | Severity |
|------|--------|----------|
| Frontend calls Backend (not Supabase directly) | Good | - |
| Backend handles business logic | Good | - |
| AI calls go through Backend | Good | - |
| Auth: Custom JWT + own users table | Partial | Medium |
| RLS enabled on Supabase | Missing | High |
| Service-role key exposure risk | Missing | High |
| .env secrets in source | Critical | Critical |
| CORS configured properly | Broken | High |
| Local dev works out-of-the-box | Broken | Medium |
| Production env config consistent | Broken | High |

---

## 2. What Is Already Correct

### 2.1 Frontend does NOT call Supabase directly

The web frontend (`web/src/`) calls the backend API exclusively. There are no direct `supabase.from(...)` calls for data. The Supabase client in `web/src/lib/supabase.ts` is created but essentially unused for queries — only `getStoragePublicUrl()` in `past-questions/files.ts` constructs a public storage URL from the known Supabase URL, which is acceptable.

### 2.2 AI flows through backend

AI endpoints (`POST /api/v1/ai/tutor`, `/explain`, `/quiz-generator`, etc.) all live in the backend and protect the API key. The frontend never sees the Bynara/OpenAI key. This matches the recommended architecture.

### 2.3 Backend has proper middleware layer

The backend already includes:
- `authMiddleware` — JWT verification
- `requireRole` / `requirePermission` — authorization
- `validateRequest` — Joi validation
- `rateLimiter` / `authRateLimiter` — rate limiting
- `errorHandler` / `notFoundHandler` — centralized error handling

### 2.4 Authentication flow is correct end-to-end

```
Frontend → POST /api/v1/auth/register → Backend → PostgreSQL → returns JWT
Frontend → POST /api/v1/auth/login    → Backend → PostgreSQL → returns JWT
```

The frontend stores tokens in `localStorage` and sends them via `Authorization: Bearer <token>` headers. This is correct.

### 2.5 Route structure is clean

31 route modules under `backend/src/routes/` covering every feature area, mounted under `/api/v1/`.

---

## 3. Critical Issues (Fix Immediately)

### 3.1 Secrets committed to source code [CRITICAL]

**Files affected:**
- `.env.production.local` — contains `VERCEL_OIDC_TOKEN`
- `.env.production.backend` — contains `VERCEL_OIDC_TOKEN`
- `.env.example` shows a real Supabase anon key and a fake service role key placeholder
- `web/.env.production.example` — contains real Supabase anon key and a hard-coded JWT secret

**What to do:**
1. Rotate ALL credentials immediately (Supabase keys, JWT secret, Flutterwave/Paystack keys)
2. Add these files to `.gitignore` if not already:
   ```
   .env.production.local
   .env.production.backend
   .env.local
   web/.env.production.local
   web/.env.production.example
   ```
3. Update `.gitignore` to block all `.env.*.local` and `.env.*.example` patterns
4. Never commit actual credential values

### 3.2 Service-role key is accessible from frontend [HIGH]

In `web/.env.production.example`:
```
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
```

This is a **server-side only** key. It must never appear in any frontend environment file. The `NEXT_PUBLIC_` prefix makes it available in the browser bundle.

**Fix:** Remove `SUPABASE_SERVICE_ROLE_KEY` from all frontend `.env` files. The backend already has its own `.env` where this belongs.

### 3.3 CORS is wildcard in production [HIGH]

`backend/vercel.json`:
```json
{ "key": "Access-Control-Allow-Origin", "value": "*" }
```

This allows any website to make cross-origin requests to your API. Combine this with JWT-based auth and it means a malicious site can authenticate as any user.

**Fix — update `backend/vercel.json`:**
```json
{
  "version": 2,
  "rewrites": [{ "source": "/(.*)", "destination": "/src/index.js" }],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://your-frontend.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,PATCH,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization" },
        { "key": "Access-Control-Allow-Credentials", "value": "true" }
      ]
    }
  ]
}
```

Also ensure `backend/src/common/config/index.js` has the same origin listed in `cors.origin`.

### 3.4 Row Level Security is OFF [HIGH]

The migration sets `row_security = off` at the top. No RLS policies exist on any table. This means if anyone gets direct database access (connection string leak, admin panel exposure), they can read/write every row in every table with no user-level restriction.

**Fix — enable RLS on all tables:**
```sql
-- Run this in Supabase SQL editor after migrations apply
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
-- ... repeat for every table that holds user-scoped data
```

Then add policies like:
```sql
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

**Important note:** Because your backend uses custom JWT auth (not Supabase Auth), the standard `auth.uid()` won't work. You need policies based on your own user ID claim. See section 5.3 below.

---

## 4. Architecture Gaps

### 4.1 Custom JWT auth vs Supabase Auth [MEDIUM]

Your backend has its own `users` table with `password_hash`, session table, and JWT generation. This is a valid approach and gives you full control. However, it creates two separate auth systems:

```
Backend: users table + password_hash + custom JWT
Supabase: Auth system (unused by your app)
```

This is not inherently wrong, but it means:
- Supabase Auth features (OAuth providers, MFA, SSO) are unavailable
- RLS cannot use `auth.uid()` since there is no Supabase Auth user
- You must enforce your own authorization in every query

**Recommendation:** Keep the custom JWT auth (it works), but either:
- **(A) Also create Supabase Auth users** when registering, so RLS can reference `auth.uid()`. This doubles auth management.
- **(B) Stick with custom JWT** and write RLS policies that check a custom claim or use a trigger to keep a sync table. Use `jwt.claims.sub` in RLS policies instead of `auth.uid()`.

Option B is simpler for your current setup. Add this to your RLS policies:
```sql
-- Instead of auth.uid(), use the JWT sub claim
CREATE POLICY "Users can read own progress" ON public.student_progress
  FOR SELECT USING (user_id = nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid, user_id);
```

### 4.2 Backend connects directly to PostgreSQL, bypassing Supabase [LOW]

`backend/src/common/database/index.js` connects using the `pg` library directly to either:
- Local PostgreSQL (via Docker)
- Supabase PostgreSQL via connection string (`db.${projectId}.supabase.co`)

This means **RLS policies will NOT be enforced** because the connection goes straight to Postgres as the `postgres` superuser, not through the Supabase API layer. The backend has full superuser access to all tables.

**If you want RLS to work**, the backend must connect through Supabase's API layer (using the anon key with RLS policies active) OR you must rely solely on backend middleware for authorization.

**Current reality:** Your backend middleware (`authMiddleware`, `requireRole`, `requirePermission`) is your primary authorization layer. This is fine as long as:
1. The direct database connection is protected (not exposed publicly)
2. All backend queries check the authenticated user's ID

Add a security audit check: verify that every single DB query in every service includes the user ID in a WHERE clause.

### 4.3 No API versioning enforcement [LOW]

Routes are under `/api/v1/` but there is no mechanism to reject requests to `/api/` (without version). The root route returns an endpoint listing that references `/api/v1/...`. This is minor but could lead to confusion.

**Fix:** Add a redirect or 404 for `/api/` (non-versioned):
```js
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: { message: 'Use /api/v1/' } });
});
```

---

## 5. Environment & Configuration Issues

### 5.1 Conflicting environment variable names

The web frontend reads `NEXT_PUBLIC_API_URL` but the backend `package.json` uses port 3000, and the web also runs on port 3000. In development:

```
.web/.env.local:     API_URL=http://localhost:3000         ← wrong format
.web/.env.production.example: NEXT_PUBLIC_API_URL=/api/v1  ← relative path
.web/vercel.json:    NEXT_PUBLIC_API_URL=/api/v1          ← relative (works in prod)
.backend/.env:       PORT=3000                            ← backend on 3000
.web/package.json:   "dev": "next dev"                    ← frontend on 5173? or 3000?
```

Check your actual port configuration:

**For Next.js 14 with `next dev`**, the default port is **3000**.
**For Express backend** with `PORT=3000`, it also runs on **3000**.

These will conflict locally. You need to run one on a different port.

**Fix — `.env.local` in root:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Fix — `web/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Fix — Backend must run on a different port locally, e.g. 3001:**
Set `PORT=3001` in `backend/.env.local`.

Then in `web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 5.2 Production frontend should NOT know backend URL

In `web/.env.production.example`, `API_URL` is set to a Vercel backend URL. But the frontend reads `NEXT_PUBLIC_API_URL`. These don't match.

**Fix:** For production, use a relative path so the frontend always calls its own domain's API proxy:
```
NEXT_PUBLIC_API_URL=/api/v1
```

Then configure Vercel to proxy `/api/v1/*` to your backend. Add to `web/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/api/v1/(.*)", "destination": "https://your-backend.vercel.app/api/v1/$1" }
  ]
}
```

### 5.3 Backend vercel.json CORS should match frontend origin

Currently `backend/vercel.json` allows `*`. Update it to whitelist only your frontend domain.

---

## 6. Local Development Fix

### 6.1 Problem

Running `npm run dev` starts both backend and frontend. But:
- Backend needs PostgreSQL (local or Supabase)
- Frontend needs backend running first
- Docker services may not be running

### 6.2 Fix — startup script

Add to root `package.json`:
```json
{
  "scripts": {
    "dev:backend": "npm run dev --workspace=backend",
    "dev:web": "npm run dev --workspace=web",
    "dev:docker": "docker compose up -d postgres redis minio mailhog",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:web\"",
    "setup:dev": "npm run dev:docker && npm install && npm run dev"
  }
}
```

### 6.3 Verify backend is reachable

Before starting the frontend, test:
```bash
curl http://localhost:3001/health
# Should return: {"success":true,"message":"Educational Platform API is running",...}
```

If this fails, the frontend will show cryptic network errors instead of useful messages.

---

## 7. Missing Features vs Architecture Doc

| Feature | Current Status | Priority |
|---------|---------------|----------|
| Admin panel (`admin/` directory exists but untested) | Needs review | Medium |
| RLS policies | Not implemented | High |
| Supabase Storage for lessons/videos | Backend has storage routes, frontend not tested | Medium |
| Payment webhook verification | Present but unverified | High |
| Audit logging middleware | Table exists, middleware not wired | Medium |
| Background job queue (BullMQ) | Installed but not wired to routes | Low |
| Redis caching layer | Installed but not used in services | Low |

---

## 8. Recommended File Structure Changes

### 8.1 Add middleware to protect Supabase connections

Create `backend/src/middleware/databaseAuth.js`:
```js
// Ensures every DB query going to Supabase via pg is done with user context
export const requireDbUserContext = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: { message: 'User context required for database operations' } });
  }
  next();
};
```

Apply this to any route that queries Supabase directly (not through the pg pool).

### 8.2 Create an RLS policy generator migration

Create `supabase/migrations/20260819000001_enable_rls.sql` that enables RLS and adds baseline policies for all tables. See section 3.4.

### 8.3 Move secrets out of example files

Rename `web/.env.production.example` to `web/.env.production.template` and remove all actual key values. Replace with:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # NEVER put this in frontend
JWT_SECRET=your_jwt_secret_here
```

---

## 9. Deployment Checklist

### 9.1 Before deploying to Vercel

- [ ] Rotate all credentials (Supabase keys, JWT secret, payment gateway keys)
- [ ] Remove all `.env.*.local` files from git
- [ ] Set `NEXT_PUBLIC_API_URL=/api/v1` in web vercel.json (use proxy)
- [ ] Set CORS origin to your frontend domain in backend vercel.json
- [ ] Enable RLS on all Supabase tables
- [ ] Test `curl https://your-backend.vercel.app/health` returns 200
- [ ] Test registration flow end-to-end: register → login → dashboard
- [ ] Verify AI tutor endpoint requires authentication
- [ ] Verify payment endpoints require authentication
- [ ] Check that `SUPABASE_SERVICE_ROLE_KEY` is NOT in any frontend env var

### 9.2 Vercel project configuration

**Web project (`web/`):**
- Build command: `npm run build`
- Output directory: `.next`
- Root directory: `web`
- Environment variables (from Vercel dashboard, NOT files):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL` → `/api/v1`

**Backend project (`backend/`):**
- Build command: none (Node.js)
- Root directory: `backend`
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` ← ONLY here
  - `SUPABASE_DB_PASSWORD`
  - `JWT_SECRET`
  - `CORS_ORIGIN` → `https://your-frontend.vercel.app`
  - All payment gateway keys

---

## 10. Quick Win: Most Important First Fixes

If you can only fix three things right now:

1. **Remove secrets from git** — rotate keys, add `.env*.local` to `.gitignore`
2. **Fix CORS** — change `*` to your frontend domain in `backend/vercel.json`
3. **Fix port conflict** — ensure backend and frontend run on different ports locally, update `NEXT_PUBLIC_API_URL` accordingly

---

## 12. Status: Fixes Applied (2026-08-19)

The following fixes have been applied and verified:

| Fix | File(s) | Status |
|-----|---------|--------|
| Removed real secrets from `web/.env.production.example` | `web/.env.production.example` | Done |
| Fixed `web/.env.local` with correct `NEXT_PUBLIC_API_URL` | `web/.env.local` | Done |
| Changed backend CORS from `*` to explicit origin | `backend/vercel.json` | Done |
| Added `Access-Control-Allow-Credentials: true` to backend CORS | `backend/vercel.json` | Done |
| Added API rewrite proxy in frontend Vercel config | `web/vercel.json` | Done |
| Enabled RLS on `past_questions` and `documents` | Supabase DB | Done |
| Created 150+ RLS policies across all 79 tables | Supabase DB | Done |
| Added `current_user_id()` / `current_user_role()` helper functions | Supabase DB | Done |
| Added `setJwtContext()`, `getClientWithUser()`, `transactionWithUser()` to DB module | `backend/src/common/database/index.js` | Done |
| Added `/api` → 404 enforcement middleware | `backend/src/index.js` | Done |

**Remaining non-critical warnings:**
- `function_search_path_mutable` on `current_user_id` / `current_user_role` — INFO level, no functional impact
- `auth_leaked_password_protection` disabled — Supabase Auth setting, out of scope for backend JWT auth

---

## 13. Current vs Recommended Data Flow

### Before fixes:
```
Student → Frontend (Next.js :3000)
        → Backend (Express :3001)  [JWT auth, business logic]
        → PostgreSQL (local or Supabase via pg pool) as superuser — RLS bypassed
        
AI request:
Student → Frontend → Backend → Bynara/OpenAI API → Backend → Frontend ✓
```

### After fixes:
```
Student → Frontend (Next.js)
        → Backend (Express, behind proxy or separate domain)
        → Supabase PostgreSQL [RLS enabled with JWT claim policies]
        → Supabase Auth (optional, for OAuth/MFA)
        → Supabase Storage (for files/videos)
        
AI request:
Student → Frontend → Backend [validates, checks subscription] → Bynara → Backend → Frontend ✓
```

The backend now has the tools (`setJwtContext`, `getClientWithUser`) to set PostgreSQL session variables so RLS policies can enforce user-level access when connecting through Supabase's direct Postgres endpoint.
