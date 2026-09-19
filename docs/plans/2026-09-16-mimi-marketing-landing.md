# Mimi Marketing Landing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the public Mimi entry screen with a full marketing landing experience and keep account flows on their own routes.

**Architecture:** `mimi-landing.tsx` owns the public section sequence and exposes existing signup, login, and demo callbacks. Its paired stylesheet provides a desktop-first, responsive marketing layout while using local Mimi anatomy and mascot assets instead of third-party branding or media.

**Tech Stack:** React, TypeScript, Vite, local public assets, CSS.

---

### Task 1: Rebuild the marketing section hierarchy

**Files:**
- Modify: `app/mimi-landing.tsx`

**Step 1:** Define reusable body-system and feature-card data.

**Step 2:** Render the public navigation, large hero, anatomy carousel, product storytelling sections, membership callout, download block, and full footer in that order.

**Step 3:** Route account CTAs through the existing callbacks and keep the demo CTA functional.

### Task 2: Establish responsive marketing visual language

**Files:**
- Modify: `app/mimi-landing.css`

**Step 1:** Create typography, color, button, panel, and layout primitives.

**Step 2:** Style the desktop experience with strong section transitions and asset-led visual panels.

**Step 3:** Add tablet and phone layouts that preserve CTA visibility and horizontal system navigation.

### Task 3: Verify the public routes

**Files:**
- Test: `app/page.tsx`, `vercel.json`

**Step 1:** Run `npm run check`.

**Step 2:** Run `npm run build`.

**Step 3:** Open `/`, `/login`, and `/signup` locally and verify the public navigation and routing behavior.

