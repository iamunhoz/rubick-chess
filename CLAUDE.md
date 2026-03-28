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
- `docs/plans/` — Historical design docs and implementation plans.

## Key Concepts

- **Topology**: `step(pos, dir)` moves one cell in N/E/S/W, wrapping across face edges via 3D projection.
- **Rotation abilities**: Corner bishops rotate their face, corner rooks rotate an adjacent face, corner queens do both.
- **Pawn promotion**: Pawns promote to Queen after crossing 2 face boundaries.
- **No check/checkmate** enforcement yet.

## Workflow

- Work on feature branches, merge into `main`, push both.
- Verify Netlify deploy after each push (see `docs/process/deploy-verification.md`).
- XO is the sole developer.

## Roadmap

### Phase 1 — UI Polish
- Black piece silhouette brightness (paused — proposed: color `#5d667c`, opacity `0.55`)
- Undo support
- HUD cleanup (consolidate rotate panel vs floating bubble)
- General visual and UX improvements

### Phase 2 — Multiplayer
- Turn-based play (alternating W/B)
- Check/checkmate enforcement
- Online multiplayer (networking, game rooms, state sync)

### Phase 3 — AI Opponents
- Single-player mode with AI enemy
- Move evaluation and search on a cube topology

---

## Recommended Agents

Agents best suited for this project's specific architecture and roadmap. The game has a clean separation between pure rules logic (`src/rules/`), Three.js rendering (`src/render/`), and UI (`src/ui/`), which maps well to specialized agents.

### Core Development Agents

| Agent | When to use | Project context |
|-------|-------------|-----------------|
| **Software Architect** | System design, monorepo restructuring, architectural decisions | Designing the command pattern for undo/redo, planning the client-server split for multiplayer, defining the shared types package |
| **Frontend Developer** | UI components, HUD redesign, CSS, client-side game loop | HUD cleanup, selection UI, responsive layout, camera controls polish |
| **Backend Architect** | Server-side logic, API routes, WebSocket handlers, game room management | Multiplayer server (Colyseus or PartyKit), authoritative game state, room lifecycle |
| **Senior Developer** | Complex cross-cutting implementations requiring deep expertise | Three.js shader integration, WebGL post-processing pipeline, Web Worker AI architecture |
| **AI Engineer** | ML model development, algorithm design, training pipelines | Phase 3 AI opponent: alpha-beta search, MCTS implementation, evaluation function design, Web Worker computation offloading |

### Quality & Testing Agents

| Agent | When to use | Project context |
|-------|-------------|-----------------|
| **Code Reviewer** | Post-implementation review for correctness and maintainability | Review topology edge cases, Three.js memory management, state mutation safety |
| **Performance Benchmarker** | Measuring and optimizing system performance | Three.js frame rate profiling, AI search time-per-move benchmarks, GLB load time optimization |
| **API Tester** | API validation and integration testing | Multiplayer WebSocket endpoint testing, game room API contracts |
| **Security Engineer** | Threat modeling and input validation | Multiplayer anti-cheat (server-authoritative validation), move input sanitization, rate limiting |

### Architecture & DevOps Agents

| Agent | When to use | Project context |
|-------|-------------|-----------------|
| **DevOps Automator** | CI/CD, deployment configs, infrastructure | Netlify config optimization, CI pipeline for Vitest + Playwright, multiplayer server deployment |
| **Database Optimizer** | Schema design and query optimization | Game persistence (save/load), player accounts, match history, leaderboards |

### Design & UX Agents

| Agent | When to use | Project context |
|-------|-------------|-----------------|
| **UX Architect** | UX foundations, CSS systems, layout strategy | HUD redesign, game flow (piece selection → move → ability → confirm), mobile touch adaptation |
| **UX Researcher** | Usability testing and behavior analysis | Playtesting the cube navigation (is snap-to-face discoverable?), rotation ability UX |

### Orchestration

| Agent | When to use | Project context |
|-------|-------------|-----------------|
| **Agents Orchestrator** | Multi-task pipeline coordination | Running full feature implementations through the PM → Architect → Dev ↔ QA loop (invoke explicitly) |

### Phase-Specific Agent Recommendations

**Phase 1 (UI Polish):** Frontend Developer + UX Architect + Code Reviewer
- Undo/redo: Software Architect (design command pattern) → Frontend Developer (implement)
- HUD cleanup: UX Architect (design) → Frontend Developer (build)
- Visual improvements: Senior Developer (Three.js post-processing, shaders)

**Phase 2 (Multiplayer):** Software Architect + Backend Architect + Frontend Developer + Security Engineer
- Architecture: Software Architect (client-server split, shared types via pnpm workspaces)
- Server: Backend Architect (Colyseus rooms, authoritative state, reconnection)
- Client networking: Frontend Developer (state sync, optimistic rendering)
- Anti-cheat: Security Engineer (server-side move validation, rate limiting)

**Phase 3 (AI):** AI Engineer + Senior Developer + Performance Benchmarker
- Search algorithm: AI Engineer (alpha-beta or MCTS adapted for cube topology)
- Web Workers: Senior Developer (offload computation, `comlink` for RPC)
- Difficulty tuning: Performance Benchmarker (time-per-move at each depth)

## Recommended Skills

Skills (slash commands) most useful during development of this project.

### Planning & Architecture

| Skill | Command | When to use |
|-------|---------|-------------|
| **create-implementation-plan** | `/create-implementation-plan` | Before starting any roadmap feature — produces a structured plan file in `docs/plans/` |
| **discovery-interview** | `/discovery-interview` | When a feature idea is vague — transforms it into a detailed spec through guided questions |

### Code Quality

| Skill | Command | When to use |
|-------|---------|-------------|
| **simplify** | `/simplify` | After implementing a feature — reviews changed code for reuse, quality, and efficiency |
| **cspell** | `/cspell` | When CI flags unknown words in code comments or string literals |

### Visual & UI

| Skill | Command | When to use |
|-------|---------|-------------|
| **polish** | `/polish` | Pre-deploy final pass — fixes alignment, spacing, consistency micro-details |
| **critique** | `/critique` | Evaluate HUD/UI designs for visual hierarchy, cognitive load, and usability |
| **arrange** | `/arrange` | Fix layout, spacing, and visual rhythm issues in the HUD or overlay UI |
| **animate** | `/animate` | Add purposeful micro-interactions (piece selection feedback, move confirmation, rotation start/end) |
| **delight** | `/delight` | Add personality touches that make the game feel polished (hover effects, sound cues, transitions) |
| **colorize** | `/colorize` | When the dark theme feels too monochromatic — add strategic color accents |
| **quieter** | `/quieter` | If visual effects become overstimulating — tone down without losing quality |
| **adapt** | `/adapt` | Make the game work across screen sizes (mobile touch, tablet, desktop) |
| **clarify** | `/clarify` | Improve UX copy — ability labels, error messages, status text in the HUD |

### Performance & Reliability

| Skill | Command | When to use |
|-------|---------|-------------|
| **audit** | `/audit` | Run accessibility + performance checks on the game UI |
| **optimize** | `/optimize` | Diagnose frame rate drops, Three.js memory leaks, or bundle size bloat |
| **harden** | `/harden` | Add error handling, edge cases, and resilience (especially before multiplayer) |

### Build & Config

| Skill | Command | When to use |
|-------|---------|-------------|
| **vite** | `/vite` | Vite config questions, plugin setup (e.g., `vite-plugin-glsl` for shaders), build optimization |
| **bun-development** | `/bun-development` | If migrating from pnpm/node to bun for faster dev cycles |
| **docker-patterns** | `/docker-patterns` | Containerizing the multiplayer server for deployment |

### Learning & Exploration

| Skill | Command | When to use |
|-------|---------|-------------|
| **teach** | `/teach [topic]` | Deep-dive into Three.js shaders, WebSocket architecture, MCTS algorithms, etc. |
| **db-query** | `/db-query` | Natural language queries against the game database (when persistence is added) |

### Workflow

| Skill | Command | When to use |
|-------|---------|-------------|
| **dotfiles** | `/dotfiles` | Commit dotfile changes from dev environment |
| **find-skills** | `/find-skills` | Discover additional skills as new needs arise |

## Technical Notes for Agents

Context that agents should know when working on this codebase.

### Rules Engine (Pure Logic)
- All game state is immutable Maps — `board.set()` returns a new board.
- `step(pos, dir)` is the fundamental topology primitive — all movement uses it.
- Face rotations permute pieces AND update pawn `forwardDir`.
- Tests cover all 6 faces × 16 squares × 4 directions for topology correctness.

### Rendering (Three.js)
- GLB models are loaded once via `preloadPieceModels()`, cached by `ModelKey = "${Color}:${PieceKind}"`.
- Each piece on the board is a cloned `THREE.Object3D` with its own material instance (needed for selection highlighting).
- Rotation animations use a temporary pivot group — input is locked during animation.
- Sky background is a `CanvasTexture` with animated clouds, redrawn each frame.
- Memory: dispose geometry/material/texture when removing objects. Monitor `renderer.info.memory`.

### Performance Targets
- Maintain 60fps with 96 tiles + 32 pieces + post-processing effects.
- Keep draw calls under 100.
- GLB load time under 500ms on broadband.
- AI move computation under 1s (easy), 5s (hard) — must run in Web Workers.

### Key Libraries to Consider
- `postprocessing` (pmndrs) — outline, bloom, SMAA for visual polish
- `vite-plugin-glsl` — GLSL shader imports in Vite
- `stats-gl` — FPS/CPU/GPU dev overlay
- `gltf-transform` — GLB optimization (Draco compression, KTX2 textures)
- `colyseus` or `partykit` — multiplayer framework
- `comlink` — simplified Web Worker RPC for AI computation
- `lil-gui` — dev-time parameter tweaking
