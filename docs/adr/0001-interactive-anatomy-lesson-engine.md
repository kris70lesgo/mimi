# ADR 0001: Make 3D interaction a first-class lesson activity

## Status

Proposed — awaiting implementation approval.

## Context

Mimi currently stores a lesson as a title plus an array of multiple-choice questions in `app/mimi-data.ts`. The project already contains nine interactive organ models and labelled hotspots in `app/study-viewer.tsx` and `app/study-data.ts`, but the learning path does not use them. This makes the anatomy course feel like a generic quiz rather than a visual anatomy lab.

## Decision

Replace the MCQ-only question shape with a discriminated `Activity` union. Each lesson becomes an ordered activity sequence. The initial supported activities are `mcq`, `identify-hotspot`, `type-label`, `function-from-model`, `sequence-flow`, and `case-application`. A reusable lesson-mode 3D viewer will wrap the existing Three.js renderer and expose orbit, zoom, reset, labelled targets, and controlled reveal/selection states.

Content is authored as local, versioned TypeScript data initially. A repository layer will later allow the same activity and progress shapes to be stored in Supabase without requiring credentials during UI development.

## Consequences

Benefits:

- Most learning checks will be visual and spatial, which suits anatomy.
- Existing GLB models become part of the course rather than a separate atlas feature.
- New activities and medical-review metadata can be added without rewriting the lesson player.

Costs and mitigation:

- More content needs quality review. Every activity will carry a source/reference field and an author/reviewer status.
- Full-body regions without dedicated GLBs need a separate atlas adapter. The first release only promises the nine available organ models; body-wide activities follow as a second adapter.
- WebGL can fail or be inaccessible. Each activity needs a labelled-image/keyboard alternative and a graceful load-error state.

## Alternatives considered

1. Keep MCQs and open the atlas after a mistake. Rejected: it treats 3D as remediation, not learning.
2. Create a new 3D stack for lessons. Rejected: the current Three.js renderer already supports orbit, zoom, hotspots, reset, and model loading.
3. Make all answers free text. Rejected: useful for recall, but too frustrating as the only mode; spatial selection, sequencing, and cases assess different skills.
