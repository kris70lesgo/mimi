# Mimi Interactive Anatomy Curriculum Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn Mimi from a short MCQ path into a medically useful, Duolingo-paced anatomy course where students learn by rotating, zooming, identifying, and reasoning with real 3D structures.

**Architecture:** Replace the `questions[]`-only lesson shape with a typed activity sequence. Reuse the existing Three.js GLB viewer for organ-focused activities, while keeping a local content/progress repository so the UI can be tested without Supabase credentials and moved to Supabase later without a data-model rewrite.

**Tech Stack:** React 19, TypeScript, Vite, Three.js, existing GLB anatomy models, localStorage progress adapter; Supabase Auth/Postgres in the deferred sync adapter.

---

## Product definition

The core loop is **observe → manipulate → recall → apply → celebrate**. A student should not be able to finish an organ lesson by guessing from a text prompt alone: they rotate and zoom the object, identify a structure, explain or choose its role, then apply it in a short clinical context.

Activity mix per eight-activity lesson:

| Activity | Target share | What the student does |
| --- | ---: | --- |
| 3D identify / inspect | 38% | Rotate/zoom a model, then select the requested landmark. |
| Typed recall | 18% | Type the name of a highlighted structure; accepted aliases are normalized. |
| Function and relationship | 18% | Select a structure on the model, then answer a function/relationship prompt. |
| Sequence / pathway | 14% | Order blood, air, nerve, or digestive flow using draggable steps. |
| Clinical micro-case | 12% | Infer the implicated region/structure from a concise clinical scenario. |

MCQs remain as a quick diagnostic or review tool, but never make up the majority of a new lesson.

### Supported activity contracts

```ts
type Activity =
  | { kind: 'identify-hotspot'; organ: StudyId; target: string; prompt: string; hint: string; explanation: string }
  | { kind: 'type-label'; organ: StudyId; target: string; prompt: string; accepted: string[]; explanation: string }
  | { kind: 'function-from-model'; organ: StudyId; target: string; prompt: string; options: string[]; answer: number; explanation: string }
  | { kind: 'sequence-flow'; prompt: string; steps: { id: string; label: string }[]; answer: string[]; explanation: string }
  | { kind: 'case-application'; organ: StudyId; prompt: string; options: string[]; answer: number; explanation: string; target?: string }
  | { kind: 'mcq'; prompt: string; options: string[]; answer: number; explanation: string; concept?: string };
```

All activity records need `id`, `difficulty` (`foundation | preclinical | clinical`), `learningObjective`, `references`, and `reviewStatus`. The answer/explanation appears only after a graded attempt; the model remains manipulable in every 3D activity.

## Curriculum plan

This is the first complete course map. Each named lesson contains 6–8 activities rather than three recycled questions.

| Section | Lessons | Interactive anchors |
| --- | --- | --- |
| 1. Foundations (10) | Anatomical position; directional language; planes; cavities and membranes; regions and quadrants; surface landmarks; imaging orientation; movement vocabulary; map lab; checkpoint | Full-body atlas adapter, heart/lungs orientation checks, rotate-to-find tasks |
| 2. Skeletal system (12) | Bone classes; axial skeleton; skull; vertebral column; thorax; upper limb; hand; pelvis; lower limb; joints; movement; checkpoint | Atlas adapter initially; add dedicated skeletal GLB before fine-label activities |
| 3. Heart & circulation (12) | External anatomy; chambers; valves; great vessels; coronary circulation; conduction; cardiac cycle; pressure/flow; fetal circulation; ECG orientation; clinical cases; checkpoint | Existing heart GLB |
| 4. Brain & nerves (10) | Brain orientation; lobes; cerebellum; brainstem; cranial nerves; motor/sensory paths; reflexes; autonomic pathways; cases; checkpoint | Existing brain GLB |
| 5. Respiration (10) | Airway; lobes; bronchial tree; pleura; alveoli; gas exchange; ventilation/perfusion; diaphragm; cases; checkpoint | Existing lungs GLB |
| 6. Digestion & metabolism (10) | GI map; stomach; liver; pancreas; intestine; portal system; absorption; endocrine pancreas; cases; checkpoint | Existing liver, pancreas, intestine GLBs |
| 7. Renal, sensory & integument (12) | Kidney anatomy; nephron overview; fluid balance; eye; vision path; skin layers; wound response; integrated cases; checkpoints | Existing kidneys, eye, skin GLBs |

### Medical-student-quality starter items

These demonstrate the level and do not substitute for faculty review:

- **Heart identify:** Rotate the heart to locate the left ventricle. Prompt: “Select the chamber with the thickest myocardium and the direct outflow to systemic circulation.”
- **Heart reasoning:** Highlight the mitral valve. Prompt: “During ventricular systole, which backflow does this valve prevent?” Explanation references pressure gradient and left atrium.
- **Heart sequence:** Order: superior/inferior vena cava → right atrium → tricuspid valve → right ventricle → pulmonary trunk.
- **Lung case:** On the 3D lungs, “An aspirated object is more likely to enter which main bronchus, and what anatomic features explain it?”
- **Brain identify:** “Rotate to posterior-inferior view and select the structure most associated with coordination of gait and eye movements.”
- **Kidney function:** Highlight renal cortex, then ask which nephron component begins filtration and why cortex is a plausible location.
- **Foundations imaging:** Show a transverse atlas slice and ask what is anterior/posterior from the radiologic convention before asking a relationship question.

Every claim should be checked against a specified anatomy source (for example, Gray’s Anatomy for Students or Moore’s Clinically Oriented Anatomy) before being released as course content.

## Interaction and visual behavior

The lesson retains the current full-screen, sidebar-free exercise shell. A 3D activity uses a large central canvas with visible `Drag to rotate`, `Scroll/pinch to zoom`, and `Reset view` controls only until the learner has used each capability once. The target is hidden during `identify-hotspot`; after an attempt, it becomes a labelled callout. Keyboard users can cycle available labels and select with Enter; a text-based landmark list is available whenever WebGL cannot load.

Correct and wrong feedback keep the full-width green/red panels already implemented. Their detail changes by activity: a wrong 3D selection says what landmark was selected, highlights the correct one, and provides a one-sentence anatomical reason. A typed answer supports normalized aliases (e.g. `left ventricle`, `LV`) but never fuzzy-matches a different structure.

## Data and progress design

Local data is the source of truth while no Supabase credentials are supplied. Store activity results with `lessonId`, `activityId`, `attempts`, `correct`, `elapsedSeconds`, `lastSeenAt`, and a `viewerInteractions` flag. Mastery is derived from accuracy, recency, and hint use—not a simple +12 score. The future Supabase adapter writes the same shape, keyed by authenticated user ID; guest data can be merged after sign-in.

## Implementation tasks

### Task 1: Introduce typed curriculum data

**Files:**
- Create: `app/mimi-lesson-types.ts`
- Create: `app/mimi-curriculum.ts`
- Modify: `app/mimi-data.ts`
- Test: `app/mimi-curriculum.test.ts`

1. Write failing tests that reject activities missing a target/accepted answer and assert every lesson has 6+ activities.
2. Define `Activity`, `Lesson`, `Unit`, source/review metadata, and activity validation helpers in `mimi-lesson-types.ts`.
3. Move current content into `mimi-curriculum.ts`; expand Foundations and Heart first to the course map above without reusing the same question array.
4. Update `mimi-data.ts` to export the curriculum-derived `units` and `allLessons` for compatibility.
5. Run the focused test, `npm run check`, and `npm run build`.

### Task 2: Extract a reusable interactive model canvas

**Files:**
- Create: `app/interactive-anatomy-viewer.tsx`
- Create: `app/interactive-anatomy-viewer.test.tsx`
- Modify: `app/study-viewer.tsx`
- Modify: `app/study-data.ts`
- Modify: `app/globals.css`

1. Write tests for target visibility, keyboard selection, reset, load-error fallback, and `onSelectTarget` callbacks.
2. Move Three.js setup/cleanup, OrbitControls, resize handling, and hotspot projection out of `study-viewer.tsx` into `InteractiveAnatomyViewer`.
3. Give the component modes: `study`, `identify`, `reveal`, and `guided`; only `study` shows all hotspots immediately.
4. Preserve `StudyViewer` as the atlas wrapper so existing organ study remains unchanged.
5. Add a labelled non-WebGL fallback and `prefers-reduced-motion` behavior.
6. Run tests, `npm run check`, and `npm run build`.

### Task 3: Replace the MCQ-only lesson player with activity renderers

**Files:**
- Create: `app/mimi-activity-player.tsx`
- Create: `app/mimi-activity-player.css`
- Create: `app/mimi-activity-player.test.tsx`
- Modify: `app/mimi-app.tsx`
- Modify: `app/mimi-lesson-options.css`
- Modify: `app/mimi-lesson-chrome.css`

1. Write one failing render/interaction test per activity kind, including no selection before an identify attempt is graded.
2. Split `LessonPlayer` into shell/progress/feedback plus activity renderers.
3. Implement `identify-hotspot` first; it must require user selection on the 3D model, not a text button.
4. Implement type-label normalization, sequence ordering, function-from-model, and clinical case renderers.
5. Use the existing full-width success/failure panel; provide activity-specific explanations and reveal the correct target after grading.
6. Verify the sidebar is hidden, only the lesson hearts show, and the feedback is flush to the viewport in Chrome/Brave at desktop and mobile widths.

### Task 4: Build the Foundations atlas adapter

**Files:**
- Create: `app/lesson-atlas-viewer.tsx`
- Create: `app/lesson-atlas-viewer.test.tsx`
- Modify: `app/scene.tsx`
- Modify: `app/anatomy.ts`
- Modify: `app/mimi-curriculum.ts`

1. Write failing tests for a supplied target ID resolving to an atlas element and unsupported targets showing a content fallback.
2. Add a narrow lesson-facing adapter over the existing full-body model loader; do not duplicate its data loading pipeline.
3. Support camera presets for anterior/posterior/lateral/transverse orientation and target isolate/reveal.
4. Use it for Foundations (planes, position, cavities, regions), then skeletal landmarks where atlas coverage is adequate.
5. Run `npm run check`, `npm run build`, and manual mouse/touch keyboard tests.

### Task 5: Add credible content and curriculum quality gates

**Files:**
- Create: `docs/content/anatomy-content-style-guide.md`
- Create: `docs/content/review-log.md`
- Modify: `app/mimi-curriculum.ts`
- Test: `app/mimi-curriculum.test.ts`

1. Document prompt rules: one learning objective, clear viewpoint, no trick wording, correct explanation, source, and reviewer status.
2. Add a test that blocks unpublished activities without a reference, rationale, difficulty, and review status.
3. Author the vertical slice: 10 Foundations lessons and 12 Heart lessons, each with 6–8 activities and the defined activity mix.
4. Faculty/medical-student review each released activity; record corrections and source edition/page in `review-log.md`.
5. Gate unavailable 3D targets behind the explicit fallback rather than silently replacing them with unrelated MCQs.

### Task 6: Progress repository and Supabase-ready sync boundary

**Files:**
- Create: `app/mimi-progress-repository.ts`
- Create: `app/mimi-progress-repository.test.ts`
- Modify: `app/mimi-progress.ts`
- Modify: `docs/supabase/mimi-schema.sql`
- Create: `docs/supabase/mimi-sync-contract.md`

1. Write a contract test that local and Supabase implementations return the same progress shape.
2. Create a localStorage repository for guest progress and migrations from the current `MimiProgress` format.
3. Capture activity attempts and derive mastery/review queue from the recorded results.
4. Extend the existing SQL schema with `lesson_activity_attempts`, stable activity IDs, RLS policy notes, and offline conflict rules.
5. Keep the Supabase adapter inactive until credentials are provided; prove local reload persistence in the browser.

### Task 7: Learning analytics, accessibility, and performance acceptance

**Files:**
- Create: `docs/acceptance/interactive-lessons.md`
- Modify: `app/interactive-anatomy-viewer.tsx`
- Modify: `app/mimi-activity-player.tsx`

1. Add event hooks for model rotated, model zoomed, target revealed, hint used, submitted, and completed; initially log only through the local repository.
2. Verify keyboard-only target selection, accessible status announcements, touch controls, and no-WebGL fallback.
3. Measure model load, ensure renderer disposal on lesson transition, and cap device pixel ratio as the current viewer already does.
4. Run the complete test suite, `npm run check`, `npm run build`, and a manual test matrix for desktop + mobile.

## Release sequencing

1. **Vertical slice:** interactive Heart chambers lesson plus two expanded Foundations lessons. Proves real 3D learning end-to-end.
2. **First course release:** all Foundations and Heart lessons; local progress, review queue, and robust fallbacks.
3. **System expansion:** brain, lungs, digestive, renal/sensory/skin using the existing nine GLBs; skeletal uses atlas until a dedicated GLB is added.
4. **Account/sync release:** Supabase Auth plus cloud merge when credentials and product copy are approved.

## Acceptance criteria

- A new lesson has at least six activities, and at least half require either model interaction or a constructed response.
- A learner can orbit, zoom, reset, and identify an organ landmark without leaving a lesson.
- Correct/wrong feedback explains the anatomy and reveals the relevant model target.
- Foundations and Heart have unique, medically reviewed activity sets—no copied question arrays.
- Guest progress survives reload; the data model can sync to Supabase later with no lesson-player rewrite.
- All existing Atlas study flows still work, TypeScript passes, and the production build succeeds.
