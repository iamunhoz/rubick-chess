# Rubicks Chess Roadmap Discovery

**Date:** 2026-03-28
**Status:** Complete
**Scope:** Fleshing out Phase 1-3 roadmap details through discovery interview

---

## Executive Summary

Rubicks Chess is a 3D chess game played on a Rubik's cube, targeting multi-platform release (web, Steam, mobile) with Free and Pro tiers. The core MVP is complete; this discovery session defined requirements for UI polish, multiplayer, and AI opponents.

---

## Phase 1: UI Polish

### Removed from Scope
- **Black piece visuals** — Requires dedicated visual design session (separate topic)
- **Undo support** — No undo in chess; staying true to the rules

### HUD Redesign
- **Decision:** Bubble only
- Remove sidebar rotation controls
- Keep floating ability bubble on corner pieces
- Simplifies UI, reduces screen clutter

### Move Animations
- **Decision:** Piece-specific behavior
- Knights: Hop/arc through 3D space
- Other pieces: Slide along cube surface
- **Critical:** Must look smooth when crossing cube face boundaries

### Sound Effects
- **Decision:** Hybrid audio style
- Piece moves/captures: Classic chess sounds (wooden thunks)
- Cube rotations: Mechanical/Rubik's cube sounds (clicks, plastic)

### Mobile/Touch
- **Priority:** Core (not a stretch goal)
- Full touch controls for phones and tablets
- Consider: rotation gestures, ability triggers on small screens

### Selection Feedback
- **Hover states:** Pieces/tiles react to cursor/touch hover
- **Capture preview:** Visual indicator showing which enemy piece would be captured
- **Ability preview:** Visualize rotation effect before committing
- **Note:** Piece color states (normal, hover, selected, targeted) need dedicated discovery session

---

## Phase 2: Multiplayer

### Play Modes
- **Local hot-seat:** Two players, same device, taking turns
- **Online 1v1:** Two players over internet
- **Both equally important** from day one

### Turn Rules
- **Strict enforcement:** White moves, then black, no exceptions
- No free-play mode

### Matchmaking (Progressive Rollout)
1. **Invite links** — Share URL with friend (initial)
2. **Public lobby** — Browse/join open games
3. **Matchmaking queue** — Click "Find Game" for auto-matching

### User Accounts
- **Decision:** Optional
- Can play anonymously (temporary names)
- Accounts unlock: game history, ELO rating, leaderboards
- **Free tier:** Local multiplayer only (no account required)
- **Pro tier:** Online multiplayer (optional account)

### Move Validation
- **Decision:** Hybrid
- Client validates for instant UX feedback
- Server re-validates for anti-cheat
- Server is authoritative for game state

### Disconnection Handling
- **Timeout:** 2 minutes to reconnect
- If timeout expires: automatic forfeit
- Opponent sees "waiting for reconnection" state

### Time Controls
- **Decision:** Later feature
- Start without chess clocks
- Add as optional game setting in future update

---

## Phase 3: AI Opponents

### Difficulty Levels
- **Easy:** Avoids obvious blunders + makes intentional beginner-friendly mistakes
- **Medium:** Competent play, no handholding
- **Hard:** Genuinely challenging, satisfying to beat

### AI Compute Model
- **Decision:** Hybrid
- Easy/Medium: Client-side (Web Worker) — no server cost, works offline
- Hard: Server-side — deeper search, requires Pro tier

### Response Time
- **Target:** 1-2 seconds thinking time
- Fast enough to feel responsive, slow enough to show "thinking"

### Tier Restrictions
- **Free:** Easy AI only
- **Pro:** Full AI ladder (easy, medium, hard)

---

## Phase 4+ (Future Features)

Added to roadmap for later implementation:

| Feature | Description |
|---------|-------------|
| Spectator mode | Watch other players' games live |
| Replays | Save and replay past games |
| Leaderboards | Global rankings for competitive play |
| Tutorials | Interactive tutorial teaching cube-chess rules |

---

## Cross-Cutting Decisions

### Implementation Order
- **Flexible** — Can mix phases for optimal development flow
- Not strictly Phase 1 → 2 → 3

### Target Platforms
| Platform | Distribution |
|----------|--------------|
| Web | Own site + Netlify |
| PC | Steam (via Tauri) |
| Mobile | iOS App Store, Google Play (via Ionic) |
| Indie | itch.io |

### Technology Stack (Multi-platform)
- **Desktop:** Tauri
- **Mobile:** Ionic
- Continue using Vite + TypeScript + Three.js core

### Internationalization (i18n)
- **Build in from start** — Architecture supports multi-language
- **Launch language:** English only
- **Future languages:** Brazilian Portuguese, Chinese, Japanese, French, Arabic

### Free vs Pro Tiers
| Feature | Free | Pro |
|---------|------|-----|
| Local multiplayer | Yes | Yes |
| Online multiplayer | No | Yes |
| Easy AI | Yes | Yes |
| Medium/Hard AI | No | Yes |
| Accounts/ELO | No | Yes |

**Note:** Detailed Free vs Pro scope needs dedicated discovery session

---

## Topics for Future Discovery Sessions

1. **Piece Visual States** — Color/material system for: normal, hovered, selected, targeted states
2. **Free vs Pro Scope** — Exact feature matrix, monetization model, platform pricing

---

## Implementation Recommendations

Based on this discovery, suggested development order:

### Track A: Core Polish (Phase 1)
1. HUD cleanup (bubble only)
2. Selection feedback (hover, capture preview)
3. Move animations (piece-specific)
4. Sound effects (hybrid)

### Track B: Multiplayer Foundation (Phase 2 partial)
1. Strict turn enforcement
2. Local hot-seat mode
3. i18n architecture

### Track C: Platform Infrastructure
1. Tauri packaging for Steam
2. Ionic setup for mobile
3. PWA manifest for installable web

### Track D: Online (Phase 2 completion)
1. WebSocket server (Colyseus/PartyKit)
2. Invite links
3. Hybrid move validation
4. Reconnection handling

### Track E: AI (Phase 3)
1. Easy AI (client-side, Web Worker)
2. Medium AI (client-side, deeper search)
3. Hard AI (server-side, Pro tier)

Tracks A-C can proceed in parallel. Track D requires B.2 first. Track E is independent.
