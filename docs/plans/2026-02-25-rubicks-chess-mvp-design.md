# Rubicks Chess MVP Design

**Date:** 2026-02-25

## Goal

Build a JavaScript proof-of-concept 3D puzzle game that combines chess movement with Rubik’s-cube-style rotations on a 4×4×6 cube board.

The MVP ends when:

- A 3D cube is rendered.
- Two faces are populated with all 32 chess pieces using a 4×4 layout.
- Pieces can move across face boundaries.
- Pawns promote after crossing face boundaries twice.
- Corner bishops can rotate their current face (CW/CCW).
- Corner rooks can rotate an adjacent face via choosing “row” or “column” (CW/CCW).
- Corner queens can do either rotation.
- Check/checkmate legality is **not** enforced.

## Tech Stack

- Build/dev: Vite
- Language: TypeScript
- 3D: Three.js
- Unit tests: Vitest (rules engine is pure and deterministic)
- E2E smoke: Playwright (click to move, rotate, 1 screenshot check)

## Core Concepts

### Board

- The board is a cube with 6 faces: `U, D, F, B, L, R`.
- Each face is a 4×4 grid: rows `r=0..3`, columns `c=0..3`.
- A square is addressed by:

```ts
type Face = "U" | "D" | "F" | "B" | "L" | "R";
type Pos = { face: Face; r: 0 | 1 | 2 | 3; c: 0 | 1 | 2 | 3 };
```

Total squares: `6 * 16 = 96`.

### Pieces

- Standard chess pieces: King, Queen, Rook, Bishop, Knight, Pawn.
- Colors: White/Black.
- Each pawn tracks `facesCrossed: number` for promotion.

### Movement Across Faces

We model movement on the cube as “grid steps” in 4 cardinal directions:

- `N`: decreasing row (toward `r=0`)
- `S`: increasing row (toward `r=3`)
- `W`: decreasing column (toward `c=0`)
- `E`: increasing column (toward `c=3`)

Crossing an edge transitions to an adjacent face and applies a coordinate transform (e.g., `r`/`c` may swap or invert).

This is defined by a single canonical topology function:

```ts
type Dir = "N" | "E" | "S" | "W";
type StepResult = { to: Pos; crossedFace: boolean };

function step(pos: Pos, dir: Dir): StepResult;
```

All movement generation uses `step(...)` so that:

- Sliding pieces (rook/bishop/queen) can traverse multiple faces by repeatedly stepping in the same `dir`.
- Kings and pawns can step one square.
- Knights use a sequence-based approach (or compute via local adjacency).

### Initial Setup (MVP)

Two faces contain all 32 pieces in the same 4×4 layout, rows 0→3:

```
R N B Q
K B N R
P P P P
P P P P
```

The exact mapping of “which two faces” and which side (White/Black) is a config constant in rules (default suggestion: White on `F`, Black on `B`).

### Captures and Legality

- Captures are allowed as in chess (moving onto an occupied square of the opposing color).
- No check/checkmate enforcement for MVP.
- Stalemate/draw rules are out of scope for MVP.

## Promotion Rule (MVP)

- When applying a move, if `from.face !== to.face`, increment the pawn’s `facesCrossed`.
- When `facesCrossed >= 2` after a move, the pawn promotes immediately.
- Promotion target for MVP: default to Queen (can expand later to a choice UI).

## Rotation Abilities (MVP)

### Corner Definition

A piece is “on a corner” if it is on one of these squares:

`(r,c) ∈ {(0,0),(0,3),(3,0),(3,3)}`

### Bishop (corner-only): Face Turn

If a bishop is on a corner, the player may choose to **rotate the bishop’s current face**:

- 90° clockwise (CW)
- 90° counter-clockwise (CCW)

This is a Rubik-style face turn:

- The 4×4 face grid rotates.
- The four adjacent edge strips (length 4) cycle around the face.

### Rook (corner-only): Row/Column Turn (outermost only)

If a rook is on a corner, the player may choose:

- **Row** or **Column** (relative to the rook’s current face position)
- CW or CCW

Interpretation for MVP:

- Choosing **Row** means: turn the adjacent face that borders the rook’s square in the `N` (if `r=0`) or `S` (if `r=3`) direction.
- Choosing **Column** means: turn the adjacent face that borders the rook’s square in the `W` (if `c=0`) or `E` (if `c=3`) direction.
- The turn performed is a standard 90° face turn of that adjacent face (Rubik-style: face rotates + adjacent strips cycle).

### Queen (corner-only): Both

A queen on a corner may perform either the bishop’s face turn or the rook’s row/column turn.

## UI/Controls (MVP)

- Mouse:
  - Click piece to select.
  - Highlight legal moves.
  - Click destination to move.
- Rotate:
  - If selected piece is eligible and on a corner: show rotate controls:
    - Bishop: `FaceTurn` + `CW/CCW`
    - Rook: `RowTurn` or `ColTurn` + `CW/CCW`
    - Queen: both options
- Minimal HUD:
  - current turn (optional for MVP; can ignore turns initially)
  - selected piece + action mode
  - reset board

## Testing Strategy

### Unit tests (Vitest)

Pure rules tests must cover:

- `step(...)` correctness across all cube edges (including coordinate transforms).
- Move generation for each piece type on:
  - same face interior
  - across face boundaries
- Applying face turns:
  - face grid permutation is correct
  - adjacent strips cycle correctly
  - pieces move accordingly
- Pawn `facesCrossed` tracking + promotion at 2 crossings.

### E2E tests (Playwright)

- Load the app, verify canvas renders.
- Click a known starting piece, make one legal move across a face boundary.
- Trigger one rotation ability from a corner piece.
- Take a screenshot and compare (coarse smoke; accept some tolerances or use stable camera).

## Non-Goals (MVP)

- Check/checkmate enforcement
- Castling, en passant
- AI opponent
- Multiplayer
- Fancy animations/materials
- Mobile controls polish

