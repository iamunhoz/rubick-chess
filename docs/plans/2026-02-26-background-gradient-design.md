# Rubicks Chess — Background Gradient Design (2026-02-26)

## Goal
Improve contrast for black pieces by replacing the very dark flat background with a lighter gradient.

## Approach (Approved)
Use a small canvas-generated vertical gradient and set it as `scene.background` via a `CanvasTexture`.

## Gradient Colors
- Top: `#6f778a`
- Bottom: `#2f3547`

## Architecture
- Replace `scene.background = new THREE.Color(...)` with a `CanvasTexture` created from a tiny vertical gradient canvas.
- Keep lighting unchanged for now.

## Components
- `src/render/scene.ts`: create gradient canvas, set `scene.background` to a `CanvasTexture`.

## Testing
Manual verification in `pnpm dev`: confirm black pieces read clearly against the background.
