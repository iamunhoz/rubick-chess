# Rubicks Chess Roadmap

See `docs/discovery/2026-03-28-roadmap-discovery.md` for full details from discovery session.

## Phase 1 — UI Polish
- ~~Undo support~~ (removed — no undo in chess)
- HUD cleanup: bubble only (remove sidebar rotation controls)
- Move animations: knights hop, others slide across cube surfaces
- Sound effects: hybrid (chess sounds for pieces, cube sounds for rotations)
- Selection feedback: hover states, capture preview, ability preview
- Mobile/touch controls (core priority)
- i18n architecture (English first, then BR-PT, Chinese, Japanese, French, Arabic)
- **Pending discovery:** Piece visual states (color/material for normal, hover, selected, targeted)
- **Pending discovery:** Black piece visuals

## Phase 2 — Multiplayer
- Strict turn enforcement (W/B alternation)
- Local hot-seat mode (same device, two players) — **Free tier**
- Check/checkmate enforcement (hybrid validation: client + server)
- Online multiplayer — **Pro tier only**
  - Invite links → public lobby → matchmaking queue (progressive)
  - Optional accounts (unlock ELO, history, leaderboards)
  - 2-minute reconnection timeout
  - Server-authoritative game state
- Time controls (later feature)

## Phase 3 — AI Opponents
- Easy AI: avoids blunders + beginner-friendly mistakes, 1-2s thinking — **Free tier**
- Medium AI: competent play, client-side — **Pro tier**
- Hard AI: challenging, server-side compute — **Pro tier**

## Phase 4 — Future Features
- Spectator mode (watch live games)
- Replays (save and replay games)
- Leaderboards (global rankings)
- Tutorials (interactive rule teaching)

## Platforms
- Web (own site + Netlify)
- Steam (via Tauri)
- iOS/Android (via Ionic)
- itch.io

## Free vs Pro Tiers
| Feature | Free | Pro |
|---------|------|-----|
| Local multiplayer | Yes | Yes |
| Online multiplayer | No | Yes |
| Easy AI | Yes | Yes |
| Medium/Hard AI | No | Yes |
| Accounts/ELO | No | Yes |

**Pending discovery:** Exact feature scope, monetization model
