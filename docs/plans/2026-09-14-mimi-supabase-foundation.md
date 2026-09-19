# Mimi Supabase Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give Mimi secure personal accounts and durable learner data without allowing a public demo to write into any real learner account.

**Architecture:** A Vite browser client uses only Supabase's publishable key. Supabase Auth owns sessions; a trigger provisions a profile and learning-progress row for every new user. RLS protects every learner-owned table, while a narrowly scoped database RPC performs gem purchases atomically.

**Tech Stack:** React 19, Vite, TypeScript, `@supabase/supabase-js`, Supabase Auth, Postgres, Row Level Security, Storage.

---

### Task 1: Establish the secure schema

**Files:**
- Create: `supabase/migrations/20260914074121_mimi_learning_platform.sql`

**Steps:**
1. Create tables for profiles, progress, attempts, completions, achievements, inventory, purchases, study sets, daily activity, and private avatars.
2. Enable RLS for every public table; add owner policies and public-read policies only for catalog/public study-set data.
3. Provision personal profile/progress rows from an `auth.users` trigger in the private schema.
4. Verify with `supabase db push --linked` and `supabase db advisors --linked --type security --level warn`.

### Task 2: Keep gem purchases server-authoritative

**Files:**
- Create: `supabase/migrations/20260914075132_mimi_shop_rpc.sql`

**Steps:**
1. Define a canonical shop catalog.
2. Add `purchase_shop_item` RPC that verifies the authenticated user, server-owned cost, sufficient balance, inventory increment, and purchase history in one transaction.
3. Grant only authenticated callers access to the RPC.
4. Verify the migration and security advisor output.

### Task 3: Connect Auth and progress persistence

**Files:**
- Create: `app/supabase.ts`, `app/mimi-auth.tsx`, `app/mimi-auth.css`
- Modify: `app/page.tsx`, `app/mimi-sync.ts`, `app/mimi-app.tsx`

**Steps:**
1. Initialize the client from Vite environment variables, never a service-role secret.
2. Add email/password, Google OAuth initiation, and an explicitly temporary demo mode.
3. Load remote progress after an authenticated session and debounce saves back to the learner row.
4. Record lesson attempts/completions and route shop purchases through the secure RPC.
5. Run `npm run check`, `npm run build`, and verify a demo journey in the browser.

### Deployment checklist

1. In Supabase Dashboard → Authentication → URL Configuration, add the production URL and `http://localhost:3016` as Redirect URLs.
2. In Supabase Dashboard → Authentication → Providers, enable Google and add Google OAuth client credentials.
3. In the host (Vercel or equivalent), set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Never place a service-role key in browser environment variables or git.
