# Camera Controls (Hybrid) Design

**Date:** 2026-02-26

## Goal

Add MVP-friendly camera controls:

- Free orbit/zoom to inspect the cube.
- Snap-to-face presets to quickly align the view to a specific cube face.

## Approach

### Orbit

Use Three.js `OrbitControls` attached to the renderer canvas.

- Target: `(0, 0, 0)`
- Left-drag: orbit
- Wheel: zoom
- Limits:
  - `minDistance=4`
  - `maxDistance=25`
  - `minPolarAngle=0.2`
  - `maxPolarAngle=Math.PI-0.2`
- Damping: enabled for smoother feel (MVP).

### Snap Presets

Expose snap controls via:

- HUD buttons: `Front`, `Back`, `Left`, `Right`, `Top`, `Bottom`, `Iso` (optional)
- Hotkeys: `F/B/L/R/U/D` and `I` for iso

Snap behavior:

- Keep distance `d = camera.position.distanceTo(target)` unchanged.
- Set camera position to `target + dir * d`, where `dir` is the unit direction for the preset.
- `camera.lookAt(target)` and `controls.update()`.

Preset directions:

- `Front`: `(0, 0, +1)`
- `Back`: `(0, 0, -1)`
- `Right`: `(+1, 0, 0)`
- `Left`: `(-1, 0, 0)`
- `Top`: `(0, +1, 0)`
- `Bottom`: `(0, -1, 0)`
- `Iso`: normalized `(1, 1, 1)`

## Files

- Add: `src/render/camera.ts` (controls + snap helpers)
- Modify: `src/render/scene.ts` (install controls, expose `snapTo(...)` on scene API)
- Modify: `src/main.ts` (wire HUD + hotkeys to `scene.snapTo`)
- Modify: `src/ui/hud.ts` (add buttons, enable/disable is optional)

## Verification

- `pnpm build` succeeds.
- Manual: `pnpm dev` and verify orbit + snaps.

