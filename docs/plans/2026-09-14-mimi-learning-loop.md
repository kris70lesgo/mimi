# Mimi Learning Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Mimi feel like a cohesive, playful anatomy-learning loop with a visible path, varied medical practice, and decisive answer feedback.

**Architecture:** Keep the existing React lesson player and Supabase progress model. Extend lesson metadata and practice entry points rather than creating parallel experiences; use a focused CSS layer for the shared visual rhythm.

**Tech Stack:** React, TypeScript, Vite, CSS, Supabase progress sync.

---

### Task 1: Make lesson mode and objective explicit

**Files:**
- Modify: `app/mimi-app.tsx`
- Modify: `app/mimi-activity-player.tsx`
- Modify: `app/mimi-activity-player.css`

**Steps:** Add a human-readable activity label and compact objective panel; preserve keyboard-accessible inputs and the existing answer validation flow. Verify `npm run check`.

### Task 2: Turn practice into purposeful routes

**Files:**
- Modify: `app/mimi-app.tsx`
- Modify: `app/mimi-practice-hub.css`

**Steps:** Name routes by study behavior (identify, recall, explore, clinical reasoning), add a short expected outcome to each, and make each route enter a compatible lesson. Verify all route buttons start a lesson.

### Task 3: Strengthen the path and completion loop

**Files:**
- Modify: `app/mimi-app.tsx`
- Create: `app/mimi-learning-loop.css`

**Steps:** Add a clear next-milestone strip, progress-aware unit metadata, and tactile states for available/current/completed lesson nodes. Reuse the existing full-width correct/wrong panels and completion score.

### Task 4: Verify and ship

**Files:**
- Test: project build

**Steps:** Run `npm run check`, `npm run build`, and `git diff --check`; inspect the learning path and one typed 3D lesson in the browser; commit the cohesive feature.
