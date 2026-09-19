# Integrated Organ Study Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich the whole-body atlas detail sheet with an embedded study experience for the organs that have dedicated models and educational assets.

**Architecture:** Keep the whole-body Three.js scene and the existing isolate action intact for every atlas concept. Map supported concept names to a small catalog of dedicated GLB models, hotspots, facts, and illustrations; render that catalog in a lazy, embedded viewer only in the existing detail sheet. Unsupported structures retain the same panel and a simple isolate fallback.

**Tech Stack:** React 19, TypeScript, Three.js r159 GLTFLoader/MeshoptDecoder, Vite, existing shadcn UI primitives.

---

### Task 1: Add portable study assets and catalog

**Files:**
- Create: `public/study/*`
- Create: `app/study-data.ts`

**Step 1:** Serve the nine dedicated GLB models and their organ/location/microscopic/compare illustrations from the portable `public/study/` asset catalog.

**Step 2:** Define supported organ identities, exact/normalized name aliases, hotspots, accessible labels, concise facts, and asset paths in one catalog.

### Task 2: Build a contained detailed viewer

**Files:**
- Create: `app/study-viewer.tsx`

**Step 1:** Load the selected GLB lazily with Three.js GLTFLoader and MeshoptDecoder, normalize its bounds, and dispose all renderer and model resources on unmount.

**Step 2:** Render clear clickable hotspot markers, selection callouts, rotate/reset controls, and a short labelling quiz without affecting the whole-body scene.

### Task 3: Integrate the panel

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Step 1:** Add a consistent Study section to the current sheet. Supported structures gain Overview, Location, Microscopic, and Compare tabs; unsupported structures keep the existing universal content and isolate action.

**Step 2:** Keep the study viewer constrained inside the right-side desktop sheet and mobile bottom sheet, with internal scrolling so it cannot overlap camera and body controls.

### Task 4: Validate and document

**Files:**
- Modify: `scripts/validate-interactions.mjs`

**Step 1:** Add data-contract checks for aliases, hotspot uniqueness, and study asset mappings.

**Step 2:** Install dependencies, run type-check, asset/data validation, the interaction validator through a TypeScript-compatible runner, and production build. Inspect desktop and mobile screenshots.
