# Voxel 3D Chess Pieces (Procedural, Two-Tone) Design

**Date:** 2026-02-26

## Goal

Replace the current 2D/sprite piece rendering with procedural 3D, low-poly, voxel-style chess pieces that:

- Require no external asset files.
- Are visually readable on dark tiles.
- Work on any cube face orientation (pieces “stand” on the face).
- Use a two-tone palette (base darker + body lighter).

## Constraints

- MVP-friendly: simple silhouettes; no fine Staunton details.
- Deterministic, cached generation for performance.
- Minimal dependencies (Three.js only).

## Approach

### Mesh Construction

Create each piece as a `THREE.Group` composed of a small number of `BoxGeometry` blocks.

- Use a fixed voxel grid unit `v` (e.g. `v=0.16` world units).
- Each piece returns a group centered on its tile, with local +Y as “up”.
- Two materials:
  - `baseMat` for the bottom portion (e.g. first 1–2 layers)
  - `bodyMat` for the rest

### Palette

Two-tone per side:

- White:
  - base: slightly darker light-gray
  - body: off-white
- Black:
  - base: near-black
  - body: dark-gray

Exact colors can be tuned later; prioritize readability and contrast.

### Silhouette Definitions

Define each piece with a simple layer blueprint (per height y-layer):

- Pawn: 3–4 layers, small head block
- Knight: 5–6 layers, angled “snout” via offsets
- Bishop: 5–6 layers, thin midsection
- Rook: 5–6 layers, crenellated top via 2–4 corner blocks
- Queen: 6–7 layers, crown hints via corner blocks
- King: 6–7 layers, simple cross on top via + shaped blocks

These are voxel approximations; the plan is to iterate visually.

### Caching

Create `getPieceModel(kind, color)` that returns a **clone** of a cached prototype group:

- Cache key: `${color}:${kind}`
- Prototype uses `MeshStandardMaterial` for both base/body.

### Integration

- Add `src/render/pieces.ts` for model generation and caching.
- In `src/render/scene.ts`, replace current sprite usage with voxel groups:
  - Map board square key → `Object3D`
  - On sync, create/update/remove models to match board state.
- Orient pieces to stand on the face:
  - Compute rotation from world-up `(0,1,0)` to face normal vector (from `posToWorld`).
  - Apply quaternion to the piece group.

## Files

- Add: `src/render/pieces.ts`
- Modify: `src/render/scene.ts`

## Verification

- `pnpm build` passes.
- Manual: `pnpm dev`
  - Pieces are visible and readable.
  - Pieces stand correctly on all faces after rotations.

