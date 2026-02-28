# Initial Layout + Pawn Forward Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update initial piece placement on faces F/B and assign each pawn a forward direction based on its spawn position toward the face center.

**Architecture:** Replace the static 4×4 layout with algorithmic placement. Store `forwardDir` on pawn pieces at spawn time and use it for pawn movement; fall back to the current default if missing.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Update Setup Tests for New Layout

**Files:**
- Modify: `src/rules/setup.test.ts`

**Step 1: Write the failing tests**

Replace the current layout expectations with the new ones:

```ts
import { describe, expect, it } from "vitest";

import { createInitialGame } from "./setup";
import { getPiece } from "./board";

const pawnSquares = [
  { r: 0, c: 1 },
  { r: 0, c: 2 },
  { r: 3, c: 1 },
  { r: 3, c: 2 },
  { r: 1, c: 0 },
  { r: 2, c: 0 },
  { r: 1, c: 3 },
  { r: 2, c: 3 },
];

const cornerSquares = [
  { r: 0, c: 0 },
  { r: 0, c: 3 },
  { r: 3, c: 0 },
  { r: 3, c: 3 },
];

describe("setup.createInitialGame", () => {
  it("creates 32 pieces on two faces", () => {
    const game = createInitialGame();
    let count = 0;
    for (const piece of game.board.pieces.values()) count++;
    expect(count).toBe(32);
  });

  it("places pawns on all edge-internal squares (no corners)", () => {
    const { board } = createInitialGame();
    for (const face of ["F", "B"] as const) {
      for (const pos of pawnSquares) {
        expect(getPiece(board, { face, ...pos })?.kind).toBe("P");
      }
      for (const pos of cornerSquares) {
        expect(getPiece(board, { face, ...pos })?.kind).not.toBe("P");
      }
    }
  });

  it("places king/queen in two of the middle four squares", () => {
    const { board } = createInitialGame();
    const middle = [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 2, c: 1 },
      { r: 2, c: 2 },
    ];

    for (const face of ["F", "B"] as const) {
      const kinds = middle
        .map((pos) => getPiece(board, { face, ...pos })?.kind)
        .filter((kind): kind is "K" | "Q" => kind === "K" || kind === "Q");

      expect(kinds.sort()).toEqual(["K", "Q"]);
    }
  });

  it("places rooks, bishops, and knights in remaining squares", () => {
    const { board } = createInitialGame();
    const expectedCorners = ["R", "R", "B", "B"].sort();
    const expectedMiddleOthers = ["N", "N"].sort();

    for (const face of ["F", "B"] as const) {
      const corners = cornerSquares
        .map((pos) => getPiece(board, { face, ...pos })?.kind)
        .filter((kind): kind is "R" | "B" => kind === "R" || kind === "B")
        .sort();
      expect(corners).toEqual(expectedCorners);

      const middleOthers = [
        { r: 1, c: 1 },
        { r: 1, c: 2 },
        { r: 2, c: 1 },
        { r: 2, c: 2 },
      ]
        .map((pos) => getPiece(board, { face, ...pos })?.kind)
        .filter((kind): kind is "N" => kind === "N")
        .sort();
      expect(middleOthers).toEqual(expectedMiddleOthers);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/rules/setup.test.ts`
Expected: FAIL due to old layout.

**Step 3: Commit**

```bash
git add src/rules/setup.test.ts
git commit -m "test: update initial layout expectations"
```

---

### Task 2: Add Pawn Forward Direction Tests

**Files:**
- Modify: `src/rules/setup.test.ts`

**Step 1: Write the failing tests**

Append a test verifying pawn `forwardDir` based on spawn position:

```ts
it("assigns pawn forwardDir toward the face center", () => {
  const { board } = createInitialGame();
  const cases = [
    { face: "F", r: 0, c: 1, dir: "S" },
    { face: "F", r: 3, c: 1, dir: "N" },
    { face: "F", r: 1, c: 0, dir: "E" },
    { face: "F", r: 1, c: 3, dir: "W" },
    { face: "B", r: 0, c: 2, dir: "S" },
    { face: "B", r: 3, c: 2, dir: "N" },
    { face: "B", r: 2, c: 0, dir: "E" },
    { face: "B", r: 2, c: 3, dir: "W" },
  ] as const;

  for (const entry of cases) {
    const pawn = getPiece(board, entry);
    expect(pawn?.kind).toBe("P");
    expect(pawn?.forwardDir).toBe(entry.dir);
  }
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/rules/setup.test.ts`
Expected: FAIL (missing forwardDir).

**Step 3: Commit**

```bash
git add src/rules/setup.test.ts
git commit -m "test: add pawn forwardDir expectations"
```

---

### Task 3: Implement New Layout + Pawn Forward Dir

**Files:**
- Modify: `src/rules/types.ts`
- Modify: `src/rules/setup.ts`
- Modify: `src/rules/moves.ts`
- Test: `src/rules/setup.test.ts`

**Step 1: Implement minimal types support**

Update the `Piece` type:

```ts
export type Piece = {
  id: string;
  color: Color;
  kind: PieceKind;
  facesCrossed?: number;
  forwardDir?: Dir;
};
```

**Step 2: Implement new layout in setup**

Replace the old `layout` array with algorithmic placement:

```ts
const pawnSquares = [
  [0, 1], [0, 2],
  [3, 1], [3, 2],
  [1, 0], [2, 0],
  [1, 3], [2, 3],
] as const;

const kingSquare: [number, number] = [1, 1];
const queenSquare: [number, number] = [2, 2];
const knightSquares: Array<[number, number]> = [
  [1, 2],
  [2, 1],
];
const rookSquares: Array<[number, number]> = [
  [0, 0],
  [3, 3],
];
const bishopSquares: Array<[number, number]> = [
  [0, 3],
  [3, 0],
];

function pawnForwardDir(r: number, c: number): Dir {
  if (r === 0) return "S";
  if (r === 3) return "N";
  if (c === 0) return "E";
  return "W"; // c === 3
}
```

Then in `placeFace`, place pieces accordingly and set `forwardDir` for pawns:

```ts
for (const [r, c] of pawnSquares) {
  const kind: PieceKind = "P";
  const piece = {
    id: pieceId(color, kind, face, r, c),
    color,
    kind,
    facesCrossed: 0,
    forwardDir: pawnForwardDir(r, c),
  };
  next = setPiece(next, { face, r: r as RC, c: c as RC }, piece);
}

// then place K/Q, knights, rooks, bishops similarly
```

**Step 3: Use pawn forwardDir in moves**

Replace the pawn direction helper in `src/rules/moves.ts`:

```ts
function pawnForwardDir(_color: Color, piece?: Piece): Dir {
  return piece?.forwardDir ?? "S";
}
```

And in the pawn move section:

```ts
const forwardDir = pawnForwardDir(piece.color, piece);
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/rules/setup.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/rules/types.ts src/rules/setup.ts src/rules/moves.ts src/rules/setup.test.ts
git commit -m "feat: update initial layout and pawn forward dirs"
```

---

### Task 4: Full Test Suite

**Files:**
- None

**Step 1: Run full unit tests**

Run: `pnpm test`
Expected: PASS.

**Step 2: Commit**

No commit unless fixes are required.
