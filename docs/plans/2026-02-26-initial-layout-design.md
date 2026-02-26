# Rubicks Chess — Initial Layout + Pawn Forward Design (2026-02-26)

## Goal
Define a new initial piece layout on faces `F` and `B` with pawns on edge‑internal squares, and assign each pawn a forward direction based on its spawn position (toward the nearest face center / enemy king).

## Approach (Approved)
**Algorithmic placement + derived pawn forward.**
- Generate edge‑internal pawn positions programmatically.
- Place King/Queen in two of the middle four squares (symmetric on both faces).
- Place remaining majors on corners + remaining middle squares.
- Store `forwardDir` on each pawn at spawn; move generation uses that.

## Board Coordinates (4×4)
Rows `r0..r3`, cols `c0..c3`.

**Pawn positions (edge‑internal, no corners):**
- `(r0,c1) (r0,c2)`
- `(r3,c1) (r3,c2)`
- `(r1,c0) (r2,c0)`
- `(r1,c3) (r2,c3)`

**Middle 2×2 squares:**
- `(r1,c1) (r1,c2) (r2,c1) (r2,c2)`

## Piece Mapping (Proposed)
Symmetric for `F` (White) and `B` (Black):
- King: `(r1,c1)`
- Queen: `(r2,c2)`
- Knights: `(r1,c2)` and `(r2,c1)`
- Rooks: `(r0,c0)` and `(r3,c3)`
- Bishops: `(r0,c3)` and `(r3,c0)`

## Pawn Forward Direction
Each pawn gets `forwardDir` at spawn based on its position toward the face center:
- If on top edge (`r0`), forward is `S`.
- If on bottom edge (`r3`), forward is `N`.
- If on left edge (`c0`), forward is `E`.
- If on right edge (`c3`), forward is `W`.

## Implementation Notes
- Extend piece type with optional `forwardDir?: Dir`.
- In setup, place pawns with `forwardDir` computed from position.
- In move generation, pawns use their stored `forwardDir`, with a fallback to existing default if absent.

## Testing
- Update setup tests to assert piece counts and key placements.
- Add tests verifying `forwardDir` for pawn spawn positions.
