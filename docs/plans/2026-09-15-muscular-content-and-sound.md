# Muscular Content and Sound Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a detailed, interactive muscular-system course and optional original sound feedback to Mimi.

**Architecture:** Extend the study-organ registry with a procedural upper-arm muscle model and attach its content to a new unit. Keep sound effects local, generated through Web Audio, and controlled by a persisted learner preference.

**Tech Stack:** React, TypeScript, Three.js, Web Audio API, CSS.

---

### Task 1: Add an upper-arm study model

**Files:**
- Modify: `app/study-data.ts`
- Modify: `app/study-viewer.tsx`

**Steps:** Register biceps, triceps, and biceps-tendon landmarks; create a lightweight procedural Three.js model; verify rotation and reset controls remain functional.

### Task 2: Add muscular-system course content

**Files:**
- Modify: `app/mimi-data.ts`

**Steps:** Create 3D label, function, MCQ, and clinical-case activities covering upper arm, rotator cuff, diaphragm, contraction, and radial-nerve injury. Register ten lessons in the main path.

### Task 3: Add optional original audio feedback

**Files:**
- Create: `app/mimi-sound.ts`
- Modify: `app/mimi-app.tsx`
- Modify: `app/mimi-activity-player.tsx`
- Modify: `app/mimi-practice-hub.css`

**Steps:** Synthesize short original selection, correct, incorrect, and completion tones; persist a mute preference; provide an obvious toggle; do not play copied third-party assets.

### Task 4: Verify

**Steps:** Run `npm run check`, `npm run build`, `git diff --check`, and manually enter the Muscle map lesson to confirm type input, 3D model controls, and toggle behavior.
