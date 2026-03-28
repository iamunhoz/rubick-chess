# Rubicks Chess

Chess played on a Rubik's cube. Each face is a 4x4 grid (96 squares total). Pieces move across face boundaries seamlessly. Corner pieces can rotate cube faces like a Rubik's cube.

## Tech Stack

- Vite + TypeScript + Three.js
- Unit tests: Vitest (`pnpm test`)
- E2E: Playwright (`pnpm e2e`)
- Deployed on Netlify (auto-deploy on push to `main`)

## Architecture

- `src/rules/` — Pure game logic (no rendering). Board state, topology, moves, turns, abilities, setup.
- `src/render/` — Three.js scene, camera, GLB piece models.
- `src/ui/` — HUD controls.
- `src/main.ts` — Wires rules + rendering + UI together.
- `assets/Chess.glb` — 3D chess piece models.

## Key Concepts

- **Topology**: `step(pos, dir)` moves one cell in N/E/S/W, wrapping across face edges via 3D projection.
- **Rotation abilities**: Corner bishops rotate their face, corner rooks rotate an adjacent face, corner queens do both.
- **Pawn promotion**: Pawns promote to Queen after crossing 2 face boundaries.
- **No check/checkmate** enforcement yet.

## Keyboard Shortcuts

Full keyboard control available. See [`docs/keyboard-shortcuts.md`](docs/keyboard-shortcuts.md) for the complete reference. Powered by Mousetrap.

## Workflow

- Work on feature branches, merge into `main`, push both.
- Verify Netlify deploy after each push (see `docs/process/deploy-verification.md`).
- XO is the sole developer.

### Post-Task Visual Verification (Required)

The dev server (`pnpm dev`) is always running in a separate terminal at `http://localhost:5173`. Do NOT start it yourself.

After completing any task that changes game behavior or UI, you MUST visually verify using the **Playwright MCP** tools. This is a Three.js WebGL game — accessibility snapshots show almost nothing; you must use **screenshots** and **key presses** to test.

#### Playwright MCP Tools to Use

- `mcp__playwright__browser_navigate` — open `http://localhost:5173`
- `mcp__playwright__browser_take_screenshot` — capture the viewport (use `type: "png"`). **Save screenshots to `/tmp/`**, not the project root.
- `mcp__playwright__browser_press_key` — send keyboard input (e.g., `key: "Tab"`, `key: "ArrowRight"`, `key: "Enter"`, `key: "f"`, `key: "3"`, `key: "Escape"`)
- Do NOT rely on `browser_snapshot` for game state — the WebGL canvas has no accessible DOM nodes.

#### Verification Steps

1. Navigate to `http://localhost:5173`.
2. Take a screenshot to verify the game loaded (you should see a 3D cube with chess pieces and a sky background).
3. **Test with keyboard shortcuts** (full reference: `docs/keyboard-shortcuts.md`):
   - Press `Tab` → a piece should be selected: its tile turns **blue**, legal move tiles turn **green**, and corner pieces show an **ability bubble** (floating menu with CW/CCW buttons).
   - Press `ArrowRight` → one legal move tile should turn **orange** (the keyboard move target).
   - Press `Enter` → the piece should move to the orange tile; all highlights clear.
   - Press `f` → camera snaps to front face view.
   - Press `=` → camera zooms in.
   - Press `h` → HUD sidebar appears (with Reset, Rotate dropdowns, Camera buttons).
   - Press `Escape` → selection clears, no highlights remain.
   - On a **corner piece** (r=0|3, c=0|3): press `1`-`6` to trigger rotation abilities — the cube face should animate a 90-degree rotation.
4. Take a screenshot after each key interaction to verify the visual result.
5. **If any issue is found**: fix it, then re-test from step 1 until all checks pass.
6. Do NOT mark the task as complete until Playwright visual verification succeeds.

## Reference Docs

- **[Roadmap](docs/ROADMAP.md)** — Phases 1-4, platforms, Free vs Pro tiers
- **[Agents & Skills Guide](docs/agents-and-skills-guide.md)** — Recommended agents and slash commands per phase
- **[Technical Notes](docs/technical-notes.md)** — Rules engine, rendering, performance targets, library recommendations
- **[Discovery Findings](docs/discovery/2026-03-28-roadmap-discovery.md)** — Full roadmap discovery session results
- **[Future Discovery Topics](docs/discovery/future-discovery-topics.md)** — Queued topics for dedicated sessions
- **[Keyboard Shortcuts](docs/keyboard-shortcuts.md)** — Complete keyboard control reference
