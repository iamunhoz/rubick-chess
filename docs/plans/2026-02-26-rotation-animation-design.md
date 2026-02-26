# Rotation Animation (0.5s) Design

**Date:** 2026-02-26

## Goal

Add a 0.5s visual rotation effect when a Rubik-style turn is triggered (via bishop/rook/queen abilities).

- The visual should look like a face/layer turning 90° CW/CCW.
- At the end of the animation, the rules state is applied and the scene syncs to the new board positions.
- During animation, user input is temporarily disabled to avoid desync.

## Approach

### Animation API

Add a scene API:

- `animateTurn(face, dir, durationMs, onDone)`

Implementation:

1. Determine the face normal vector for the turned face.
2. Collect objects in the turned **outer layer**:
   - all tile meshes whose centers satisfy `dot(tileWorldPos, faceNormal) >= 1.5`
   - all piece meshes whose anchors satisfy `dot(pieceWorldPos, faceNormal) >= 1.5`
3. `attach(...)` the collected objects to a pivot `THREE.Group` at origin.
4. Rotate pivot around `faceNormal` from 0 → ±90° over `durationMs=500` using ease-in-out.
5. On completion:
   - detach all objects back to their original parent (using stored parent mapping),
   - remove pivot,
   - run `onDone()` to apply rules state and `scene.sync()`.

### Integration

- On ability click, instead of immediately applying the rules:
  - compute which face is being turned (bishop: current face, rook: adjacent face based on row/col choice and corner)
  - call `scene.animateTurn(...)`
  - in `onDone`, apply `applyAbility(...)` and resync

### Input Lock

Maintain an `isAnimating` flag in `main.ts`:

- ignore selection/move/ability input while animating
- optionally show a subtle “busy” cursor over the viewport

## Files

- Modify: `src/render/scene.ts` (pivot animation + layer selection + API)
- Modify: `src/main.ts` (ability pipeline uses animation, add input lock)

## Verification

- `pnpm test` passes.
- `pnpm build` passes.
- Manual: `pnpm dev` and trigger:
  - bishop face turn from a corner
  - rook row/col turn from a corner
  - confirm pieces visually move with the turning layer and then land in correct squares.

