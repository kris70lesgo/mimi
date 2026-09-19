# Mimi Public Landing and Auth Routes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/` a clear, public Mimi marketing page and move account authentication onto distinct `/login` and `/signup` routes.

**Architecture:** A minimal pathname state in `app/page.tsx` selects between the public landing, Mimi authentication, the app shell, and the atlas. Landing CTAs use History API navigation so the Vite SPA remains deployable without a routing dependency. The auth component receives its initial mode from the route and offers a back-to-home action.

**Tech Stack:** React, TypeScript, CSS, existing Mimi mascot/status assets.

---

### Task 1: Build the Mimi landing page

**Files:**
- Create: `app/mimi-landing.tsx`
- Create: `app/mimi-landing.css`

1. Build a public hero with distinct Mimi anatomy messaging and existing Mimi artwork.
2. Add a concise pathway preview, interactive-model story, rewards explanation, and final CTA.
3. Use semantic headings, usable buttons, responsive grids, and no Duolingo logos/assets/text.

### Task 2: Add lightweight routes

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/mimi-auth.tsx`

1. Track `window.location.pathname` and listen for browser back/forward navigation.
2. Render the landing page at `/`, auth pages at `/login` and `/signup`, and keep authenticated/demo learners in the existing app shell.
3. Ensure all route changes use `history.pushState` and preserve the existing Supabase actions.

### Task 3: Verify public and account transitions

**Files:**
- Test: `app/page.tsx`

1. Verify Build/Log in/Demo CTAs render the intended surface.
2. Run `npm run check`, `npm run build`, and `git diff --check`.
3. Commit and push the implementation.
