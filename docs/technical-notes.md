# Technical Notes

Context that agents should know when working on this codebase.

## Rules Engine (Pure Logic)
- All game state is immutable Maps — `board.set()` returns a new board.
- `step(pos, dir)` is the fundamental topology primitive — all movement uses it.
- Face rotations permute pieces AND update pawn `forwardDir`.
- Tests cover all 6 faces × 16 squares × 4 directions for topology correctness.

## Rendering (Three.js)
- GLB models are loaded once via `preloadPieceModels()`, cached by `ModelKey = "${Color}:${PieceKind}"`.
- Each piece on the board is a cloned `THREE.Object3D` with its own material instance (needed for selection highlighting).
- Rotation animations use a temporary pivot group — input is locked during animation.
- Sky background is a `CanvasTexture` with animated clouds, redrawn each frame.
- Memory: dispose geometry/material/texture when removing objects. Monitor `renderer.info.memory`.

## Performance Targets
- Maintain 60fps with 96 tiles + 32 pieces + post-processing effects.
- Keep draw calls under 100.
- GLB load time under 500ms on broadband.
- AI move computation under 1s (easy), 5s (hard) — must run in Web Workers.

## Key Libraries to Consider
- `postprocessing` (pmndrs) — outline, bloom, SMAA for visual polish
- `vite-plugin-glsl` — GLSL shader imports in Vite
- `stats-gl` — FPS/CPU/GPU dev overlay
- `gltf-transform` — GLB optimization (Draco compression, KTX2 textures)
- `colyseus` or `partykit` — multiplayer framework
- `comlink` — simplified Web Worker RPC for AI computation
- `lil-gui` — dev-time parameter tweaking
