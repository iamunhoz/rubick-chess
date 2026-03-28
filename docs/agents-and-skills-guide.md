# Agents & Skills Guide

Recommended agents and skills for Rubicks Chess development. The game has a clean separation between pure rules logic (`src/rules/`), Three.js rendering (`src/render/`), and UI (`src/ui/`), which maps well to specialized agents.

---

## Recommended Agents

### Core Development Agents

| Agent | When to use | Project context |
|-------|-------------|-----------------|
| **Software Architect** | System design, monorepo restructuring, architectural decisions | Planning the client-server split for multiplayer, defining the shared types package |
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
- HUD cleanup (bubble only): UX Architect (design) → Frontend Developer (build)
- Move animations: Senior Developer (Three.js animation, cross-face sliding)
- Sound effects: Frontend Developer (Howler.js or Web Audio API)
- Selection feedback: UX Architect (design states) → Frontend Developer (implement)
- Mobile/touch: UX Architect (gesture design) → Frontend Developer (implement)
- i18n: Frontend Developer (architecture) — use `i18next` or similar

**Phase 2 (Multiplayer):** Software Architect + Backend Architect + Frontend Developer + Security Engineer
- Architecture: Software Architect (client-server split, shared types via pnpm workspaces)
- Local hot-seat: Frontend Developer (turn state, same-device UX)
- Server: Backend Architect (Colyseus rooms, authoritative state, 2-min reconnection)
- Client networking: Frontend Developer (state sync, optimistic rendering)
- Anti-cheat: Security Engineer (hybrid validation, rate limiting)

**Phase 3 (AI):** AI Engineer + Senior Developer + Performance Benchmarker
- Search algorithm: AI Engineer (alpha-beta or MCTS adapted for cube topology)
- Web Workers: Senior Developer (offload computation, `comlink` for RPC)
- Difficulty tuning: Performance Benchmarker (time-per-move at each depth)
- Easy AI: AI Engineer (intentional mistake injection for beginner-friendly play)

**Multi-platform:** DevOps Automator + Mobile App Builder
- Tauri packaging: DevOps Automator (Steam build pipeline)
- Ionic setup: Mobile App Builder (iOS/Android builds)

---

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
