# Mimi Anatomy Learning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn Human Atlas into Mimi, a light, Duolingo-inspired anatomy learning app with a protected Explore Atlas mode and a future Supabase-backed learning profile.

**Architecture:** Split the current single-screen atlas into a reusable `AtlasExperience` feature and add a local-first learning shell with dashboard, learning path, lesson player, review, challenge, and leaderboard views. Persist prototype progress in local storage behind a repository interface; replace that repository with Supabase Auth and Postgres once environment credentials are supplied.

**Tech Stack:** React 19, Vite 8, TypeScript, Three.js, Base UI, lucide-react, localStorage for the prototype; Supabase Auth + Postgres + RLS for cloud sync.

---

## Product decisions

- Product name: **Mimi**.
- Launch curriculum: Foundations, Skeletal System, Heart & Circulation, Brain & Nervous System, Respiratory System, Digestive System.
- Students may begin as guests. Account creation (Google OAuth or email magic link) migrates local progress to the cloud.
- Visual direction: light, encouraging and game-like; medically credible rather than childish.
- The existing BodyParts3D viewer and advanced organ study views remain intact in **Explore Atlas**.
- Leaderboard is present in the prototype with seeded classmates, then becomes a weekly Supabase query after cloud sync is enabled.

## Domain model

`Course` contains ordered `Unit`s. A unit contains short `Lesson`s. A lesson owns 5–8 `Challenge`s of type `identify`, `choose`, `function`, `relationship`, `rapid`, or `clinical`. A student profile stores XP, hearts, streak, daily-goal count, lesson completion, mastery per concept, and a due-at review queue. All content is static versioned application data for the launch; only learner state is persisted.

## Task 1: Separate atlas from the application shell

**Files:**
- Create: `app/atlas-experience.tsx`
- Modify: `app/page.tsx`
- Test: `npm run check`, `npm run build`

1. Move the current atlas component unchanged into `AtlasExperience`.
2. Replace the root component with an app-shell router controlled by an explicit view state.
3. Add a dependable `Explore Atlas` entry point and a back-to-learning control.
4. Verify the full-body view, search, inspector, isolation, and advanced organ models still work from Explore.

## Task 2: Define launch curriculum and local learning repository

**Files:**
- Create: `app/mimi-data.ts`
- Create: `app/mimi-progress.ts`
- Test: `npm run check`

1. Define the six launch units and their lessons, including supported atlas concept IDs/names.
2. Create a typed local profile and safe localStorage read/write functions with a schema version and defaults.
3. Encode XP, hearts, daily activity, lesson completion, mastery, and spaced-review scheduling in pure functions.
4. Add deterministic seeded leaderboard data for the prototype.

## Task 3: Build Mimi’s learning shell and dashboard

**Files:**
- Create: `app/mimi-app.tsx`
- Create: `app/mimi.css`
- Modify: `app/page.tsx`
- Test: `npm run check`, browser screenshot at desktop and mobile widths

1. Build responsive primary navigation: Learn, Practice, Leaderboard, Explore.
2. Add dashboard cards for Continue Learning, streak, XP, level, hearts, daily goal, weak concepts, and daily challenge.
3. Use a light clinical palette with warm coral learning accents, aqua atlas accents, strong outlined controls, and accessible contrast.
4. Keep every dashboard action functional; no static dead cards.

## Task 4: Build the animated learning path

**Files:**
- Modify: `app/mimi-app.tsx`
- Modify: `app/mimi.css`
- Test: browser interaction test

1. Render the six units as a vertical path with unlocked/current/locked lesson nodes.
2. Add completion rings, mastery state, and clear lock messaging.
3. Make every active node launch its lesson.
4. Ensure the path remains usable on narrow screens without horizontal scrolling.

## Task 5: Implement lesson gameplay and results

**Files:**
- Create: `app/mimi-lesson.tsx`
- Modify: `app/mimi-app.tsx`
- Modify: `app/mimi-progress.ts`
- Test: `npm run check`; manual correct, wrong, depleted-hearts, completion flows

1. Add an accessible 3–5 minute lesson player with progress, hearts, keyboard-selectable answers, and correct/incorrect states.
2. Implement launch question types: identify, function, relationship, and clinical mini-scenario.
3. Award +10 correct XP, +50 completion XP, and +25 perfect-lesson XP.
4. Update mastery on every answer, schedule reviews, and offer practice on a hearts failure.
5. Show a completion screen with XP, heart, mastery, and next-action summary.

## Task 6: Connect lessons to the atlas

**Files:**
- Modify: `app/mimi-app.tsx`
- Modify: `app/atlas-experience.tsx`
- Test: manual wrong-answer → specific atlas concept

1. Add “Explore this structure” after an incorrect anatomy-specific answer.
2. Pass a concept name/ID to Explore Atlas and preselect it after its catalogue loads.
3. For organs supported by the advanced study viewer, make isolate open the detailed model exactly as it does today.
4. Return students to the lesson without losing their answer state.

## Task 7: Practice, daily challenge, achievements, and leaderboard

**Files:**
- Modify: `app/mimi-app.tsx`
- Modify: `app/mimi-data.ts`
- Modify: `app/mimi-progress.ts`
- Test: date rollover and XP calculations in browser

1. Generate daily challenge content deterministically from the local calendar date.
2. Generate weak-concept practice from low mastery and due reviews.
3. Add a minimal achievement set: First Lesson, 7-Day Streak, Heart Master, Bone Collector, Brain Explorer, Perfect Lesson, and Anatomy Speedrunner.
4. Render the prototype leaderboard from seeded peers plus the current learner’s local XP.

## Task 8: Prepare Supabase Auth and sync contract

**Files:**
- Create: `docs/supabase/mimi-schema.sql`
- Create: `.env.example` additions for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Create: `app/mimi-sync.ts`
- Test: type check without credentials; later, Supabase migration and RLS policy test query

1. Add an inert client factory that returns local-only mode when environment variables are absent.
2. Document Google OAuth and email magic-link configuration without committing secrets.
3. Define `profiles`, `lesson_progress`, `concept_mastery`, `review_queue`, `daily_activity`, `achievements`, and `leaderboard_weekly` tables.
4. Enable RLS on every exposed table. Use ownership predicates on select/insert/update policies; never expose a service-role key to the browser.
5. Add authenticated account-upgrade logic that merges guest local state into the owner’s rows transactionally.
6. When credentials are available, verify each table’s RLS with two test users and run Supabase security advisors.

## Task 9: Add advanced interactive 3D question support

**Files:**
- Modify: `app/study-viewer.tsx`
- Create: `app/mimi-3d-question.tsx`
- Modify: `app/mimi-lesson.tsx`
- Test: manual marker selection and model disposal checks

1. Extract the advanced organ viewer interaction into a question-safe mode that permits orbiting but prevents unrelated atlas controls.
2. Map hotspot selections to challenge answers for heart, brain, lungs, liver, kidneys, eyeball, intestine, pancreas, and skin.
3. Add tap-the-structure questions only where an accurate model/marker mapping exists; fall back to image/choice questions elsewhere.
4. Ensure WebGL resources are disposed when lessons exit.

## Acceptance checks

- Learn mode opens first; Explore Atlas remains available and functionally unchanged.
- A guest can complete a lesson, receive XP, lose hearts, improve mastery, return tomorrow, and see saved local progress.
- Wrong anatomy-specific answers can open the exact atlas structure.
- The path, practice, daily challenge, achievements, and leaderboard all have working prototype behavior.
- No Supabase secret or service-role key is present in client code.
- `npm run check` and `npm run build` pass after each implementation milestone.
