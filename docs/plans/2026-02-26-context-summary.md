# Rubicks Chess — Context Summary (through 2026-02-26)

This file summarizes what was built/changed so we can safely start a new context.

## Repo status

- Default branch: `main`
- Feature worktree/branch: `.worktrees/mvp-js` on `feat/mvp-js`

### `main` contains

- `.gitignore` (includes `.worktrees/`, `node_modules/`, `dist/`, Playwright outputs)
- Design docs:
  - `docs/plans/2026-02-25-rubicks-chess-mvp-design.md`
  - `docs/plans/2026-02-25-rubicks-chess-mvp-implementation-plan.md`
  - `docs/plans/2026-02-26-camera-controls-design.md`
  - `docs/plans/2026-02-26-voxel-piece-assets-design.md`
  - `docs/plans/2026-02-26-rotation-animation-design.md`

## What is implemented (branch `feat/mvp-js`)

### Tech

- Vite + TypeScript + Three.js
- Unit tests: Vitest (`pnpm test`)
- E2E: Playwright is present but gated behind `RUN_E2E=1` (`pnpm e2e`)

### Rules engine (`src/rules/`)

- Board model: `board.ts`, `types.ts`
- Cube topology stepping across faces: `topology.ts`
- Chess-like move generation across faces (no check/checkmate): `moves.ts`
- Apply moves + pawn promotion after 2 face crossings: `apply.ts`
- Rubik-style face turns that include adjacent strips (outer layer selection): `turns.ts`
- Corner-only special abilities:
  - Bishop/Queen: face turn
  - Rook/Queen: layer turn via row/col selection (adjacent face)
  - Implemented in `abilities.ts`
- Initial setup: 32 pieces on faces `F` (White) and `B` (Black) using layout A: `setup.ts`

### Rendering + UX (`src/render/`, `src/ui/`, `src/main.ts`)

- Renders a cube with 6 faces × 4×4 tiles.
- Renders procedural voxel chess pieces (two-tone), oriented to stand on each face:
  - `src/render/pieces.ts`
  - `src/render/scene.ts`
- Hover feedback:
  - Always-on subtle silhouette outline to separate overlapping pieces.
  - Blue glow outline on mouse hover.
- Selection:
  - Select by clicking the **piece mesh** (not the tile).
  - Legal moves are highlighted; click destination to move.
- Abilities:
  - Right-side HUD still exists (and now shows eligibility/no-op feedback).
  - Floating “ability bubble” appears above an eligible selected corner piece, with direct icon buttons:
    - Face CW/CCW, Row CW/CCW, Col CW/CCW (depending on piece).
- Camera:
  - Orbit controls (rotate/zoom) + snap presets via HUD buttons and hotkeys `F/B/L/R/U/D/I`.
  - Note: left mouse is used for selection; rotation uses right-drag.

### Rotation animation (0.5s)

- Ability-triggered turns animate the affected outer layer for 500ms:
  - A pivot group rotates the affected pieces (and a faint overlay plane) around the turned face normal.
  - After the animation completes, the rules state is applied and the scene re-syncs.
- User input is locked during the animation to avoid desync.

## How to run

From the feature worktree:

- `cd /home/iamunhoz/code/projects/rubicks-chess/.worktrees/mvp-js`
- `pnpm dev`

Controls:

- Rotate camera: **right-click drag**
- Zoom: mouse wheel
- Snap camera: keys `F/B/L/R/U/D/I` or HUD “Camera” buttons
- Select/move: left click piece, then left click highlighted destination
- Rotate ability: select a corner bishop/rook/queen and use the floating bubble (or HUD)

## Known limitations / TODOs

- No true persistent “visual cube state”: tiles don’t remain rotated as a Rubik cube would; the animation is a visual transition and final state is represented by re-positioned pieces.
- Add Undo (requested) — not implemented yet.
- Improve eligibility UX further (optional): hide/disable the right HUD rotate panel in favor of the bubble, or keep both intentionally.

