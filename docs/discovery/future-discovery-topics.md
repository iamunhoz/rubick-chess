# Future Discovery Topics

Queued topics requiring dedicated discovery sessions before implementation.

---

## 1. Piece Visual States

**Priority:** High (blocks Phase 1 selection feedback work)

**Context:** The game needs distinct visual states for pieces: normal, hovered, selected, targeted. Current implementation uses tile colors (blue/green/orange), but pieces themselves don't change appearance.

**Questions to explore:**
- Should pieces change color, material, outline, or glow?
- How do visual states interact with piece color (white vs black)?
- What about colorblind accessibility?
- Should there be animation on state transitions?
- How does this work on mobile (no hover)?

**Depends on:** Black piece visual quality session (also pending)

---

## 2. Free vs Pro Scope

**Priority:** High (affects architecture decisions)

**Context:** Game will have Free and Pro tiers across all platforms.

**Known allocations:**
| Feature | Free | Pro |
|---------|------|-----|
| Local multiplayer | Yes | Yes |
| Online multiplayer | No | Yes |
| Easy AI | Yes | Yes |
| Medium/Hard AI | No | Yes |

**Questions to explore:**
- What about spectator mode, replays, leaderboards, tutorials?
- Any cosmetic unlocks (board themes, piece skins)?
- Should Free have ads? Limited games per day?
- How to handle platform differences (Steam vs mobile vs web)?
- Trial period or one-time unlock?

**Blocked by:** Monetization model decisions

---

## 3. Black Piece Visuals

**Priority:** Medium (paused, needs dedicated session)

**Context:** Current black pieces may have visibility or style issues. User noted this requires "prolonged back and forth."

**Questions to explore:**
- What's the exact problem? (visibility, style, both)
- Material approach (metallic, matte, translucent)?
- Lighting adjustments?
- Piece model modifications?
- Consistent look across all piece types?

**Note:** May want to combine with "Piece Visual States" session.

---

## 4. Monetization Model

**Priority:** Low (future planning)

**Context:** Pro tier exists, but pricing/purchase flow undefined.

**Questions to explore:**
- One-time purchase vs subscription?
- Price point per platform?
- Platform-specific payment flows (Steam, iOS, Android, web)?
- Cross-platform purchase sync (buy once, play everywhere)?
- Launch pricing vs long-term pricing?

**Blocked by:** Free vs Pro Scope
