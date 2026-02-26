# Rubicks Chess MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a Three.js + TypeScript MVP of Rubicks Chess with a 4×4×6 cube board, chess-like movement across faces, pawn promotion after 2 face crossings, and corner-based rotation abilities.

**Architecture:** Keep all game rules pure in `src/rules/` (no Three.js). `src/render/` renders a cube, does picking, and draws highlights. `src/ui/` exposes minimal controls for rotation actions. The renderer reads state from rules and dispatches user intents back to rules.

**Tech Stack:** Vite, TypeScript, Three.js, Vitest, Playwright.

---

### Task 1: Scaffold the project (Vite + TS) and wire up test runners

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`

**Step 1: Initialize Vite + TS (pnpm)**

Run:
- `pnpm create vite@latest . -- --template vanilla-ts`
- `pnpm install`

Expected:
- `src/main.ts` exists
- `npm run dev` starts

**Step 2: Add dependencies**

Run:
- `pnpm add three`
- `pnpm add -D vitest @playwright/test`
- `pnpm exec playwright install --with-deps`

Expected:
- `npm ls three vitest @playwright/test` shows installed

**Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node" },
});
```

Update `package.json` scripts:
- `test`: `vitest`

**Step 4: Configure Playwright**

Create `playwright.config.ts` with a devServer (Vite) and one chromium project.

Create `e2e/smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("renders canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
});
```

**Step 5: Run tests once**

Run:
- `pnpm test`
- `pnpm exec playwright test`

Expected:
- both PASS (smoke test may fail until renderer creates a canvas; if so, keep it skipped until Task 3)

---

### Task 2: Define the rules domain model (no rendering)

**Files:**
- Create: `src/rules/types.ts`
- Create: `src/rules/board.ts`
- Test: `src/rules/board.test.ts`

**Step 1: Write failing tests for types and basic board ops**

Create `src/rules/board.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createEmptyBoard, getPiece, setPiece } from "./board";

describe("board", () => {
  it("starts empty", () => {
    const b = createEmptyBoard();
    expect(getPiece(b, { face: "F", r: 0, c: 0 })).toBeNull();
  });

  it("sets and gets pieces", () => {
    const b = createEmptyBoard();
    const b2 = setPiece(b, { face: "F", r: 1, c: 2 }, { kind: "P", color: "W", id: "wp1" });
    expect(getPiece(b2, { face: "F", r: 1, c: 2 })?.kind).toBe("P");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL (missing exports)

**Step 3: Implement minimal types and board**

Create `src/rules/types.ts`:

```ts
export type Face = "U" | "D" | "F" | "B" | "L" | "R";
export type Dir = "N" | "E" | "S" | "W";
export type RC = 0 | 1 | 2 | 3;

export type Pos = { face: Face; r: RC; c: RC };

export type Color = "W" | "B";
export type PieceKind = "K" | "Q" | "R" | "B" | "N" | "P";

export type Piece = {
  id: string;
  color: Color;
  kind: PieceKind;
  facesCrossed?: number; // only used for pawns
};
```

Create `src/rules/board.ts` with an immutable representation (e.g., Map keyed by `face:r:c`).

**Step 4: Run tests**

Run: `pnpm test`
Expected: PASS

---

### Task 3: Implement cube topology stepping across faces

**Files:**
- Create: `src/rules/topology.ts`
- Test: `src/rules/topology.test.ts`

**Step 1: Write failing tests for edge stepping**

Create `src/rules/topology.test.ts` with table tests that assert:
- stepping within a face updates `r/c` normally
- stepping out of each edge transitions to the correct adjacent face and transforms coordinates

Example skeleton:

```ts
import { describe, it, expect } from "vitest";
import { step } from "./topology";

describe("topology.step", () => {
  it("steps within a face", () => {
    expect(step({ face: "F", r: 2, c: 2 }, "N").to).toEqual({ face: "F", r: 1, c: 2 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL

**Step 3: Implement a concrete cube net mapping**

In `src/rules/topology.ts`, implement `step(pos, dir)` with a single, explicit adjacency mapping.

Rules to encode:
- For in-bounds: adjust r/c.
- For out-of-bounds: return `crossedFace: true`, new face, and transformed `(r,c)` for the bordering edge.

**Step 4: Add exhaustive tests**

Add a test that for every position on every face and every dir, `step(...)` returns a valid `Pos` (r/c in 0..3).

**Step 5: Run tests**

Run: `pnpm test`
Expected: PASS

---

### Task 4: Implement move generation (chess-like, no check)

**Files:**
- Create: `src/rules/moves.ts`
- Test: `src/rules/moves.test.ts`

**Step 1: Write failing tests for each piece type**

Create targeted tests:
- rook slides across face boundaries via repeated `step`
- bishop diagonals (implemented as alternating dirs; see implementation step)
- knight L-moves across boundaries
- pawn: forward, capture diagonals, no en passant

**Step 2: Run tests to see failures**

Run: `pnpm test`
Expected: FAIL

**Step 3: Implement minimal move generator**

In `src/rules/moves.ts`:
- `legalMoves(board, fromPos): Pos[]`
- Use `step` for cardinal sliding.
- For diagonals: implement `stepDiag(pos, diag)` using two cardinal steps per “diagonal tick” (e.g., NE = N then E), consistently.
- Knights: precompute 8 offsets as sequences of `step` operations (e.g., N,N,E) to survive cross-face mapping.

**Step 4: Run tests**

Run: `pnpm test`
Expected: PASS

---

### Task 5: Implement applying moves + pawn promotion after 2 crossings

**Files:**
- Create: `src/rules/apply.ts`
- Test: `src/rules/apply.test.ts`

**Step 1: Write failing tests**

- Capturing replaces opponent piece.
- Pawn increments `facesCrossed` only when `from.face !== to.face`.
- Pawn promotes to queen when `facesCrossed` reaches 2.

**Step 2: Run tests (fail)**

Run: `pnpm test`
Expected: FAIL

**Step 3: Implement applyMove**

Create:
- `applyMove(board, from, to): Board`
- Update pawn metadata and kind on promotion.

**Step 4: Run tests**

Run: `pnpm test`
Expected: PASS

---

### Task 6: Implement Rubik-style face turns (board permutation)

**Files:**
- Create: `src/rules/turns.ts`
- Test: `src/rules/turns.test.ts`

**Step 1: Write failing tests for face rotation permutation**

Test that a labeled set of pieces placed on:
- the 16 squares of a face
- the 4 adjacent edge strips
end up in correct positions after a CW turn.

**Step 2: Run tests (fail)**

Run: `pnpm test`
Expected: FAIL

**Step 3: Implement `turnFace(board, face, dir)`**

- Rotate the face’s 4×4 grid (CW/CCW index permutation).
- Cycle the four neighboring edge strips (length 4) with correct orientation (some strips reverse).
- Return a new board with pieces moved accordingly.

**Step 4: Add CCW test**

Test `CCW` is inverse of `CW`.

**Step 5: Run tests**

Run: `pnpm test`
Expected: PASS

---

### Task 7: Implement corner ability rules (bishop/rook/queen)

**Files:**
- Create: `src/rules/abilities.ts`
- Test: `src/rules/abilities.test.ts`

**Step 1: Write failing tests**

- Corner detection.
- Bishop-on-corner can face-turn current face.
- Rook-on-corner can choose row/col, mapping to adjacent face turn:
  - row: neighbor in N/S depending on r
  - col: neighbor in W/E depending on c
- Queen-on-corner can do both.
- Non-corner cannot use ability.

**Step 2: Run tests (fail)**

Run: `pnpm test`
Expected: FAIL

**Step 3: Implement `applyAbility(board, ability): Board`**

Use `turnFace(...)` under the hood.

**Step 4: Run tests**

Run: `pnpm test`
Expected: PASS

---

### Task 8: Implement initial setup (two faces populated)

**Files:**
- Create: `src/rules/setup.ts`
- Test: `src/rules/setup.test.ts`

**Step 1: Write failing tests**

- Board has 32 pieces placed.
- Layout matches `R N B Q / K B N R / P…`.

**Step 2: Run tests (fail)**

Run: `pnpm test`
Expected: FAIL

**Step 3: Implement setup**

Create `createInitialGame()` returning:
- board
- side-to-move (optional for MVP; can be omitted)

**Step 4: Run tests**

Run: `pnpm test`
Expected: PASS

---

### Task 9: Render the cube and squares (Three.js)

**Files:**
- Create: `src/render/scene.ts`
- Modify: `src/main.ts`

**Step 1: Render a cube + 96 tiles**

- Create a Three.js scene, camera, light, renderer.
- Create tile meshes for each `Pos` with a stable mapping from `Pos` to world transform.
- Append renderer canvas to DOM.

**Step 2: Manual check**

Run: `pnpm dev`
Expected: visible cube with subdivided faces.

---

### Task 10: Picking + highlight + move execution

**Files:**
- Create: `src/render/picking.ts`
- Create: `src/render/highlight.ts`
- Create: `src/ui/state.ts`
- Modify: `src/main.ts`

**Step 1: Implement clicking a tile**

- Raycast against tiles.
- Map hit mesh → `Pos`.

**Step 2: Implement selection + legal move highlights**

- On select: compute `legalMoves`.
- Highlight tiles.

**Step 3: Implement click-to-move**

- On clicking a legal destination: call `applyMove`, update state, re-render pieces.

**Step 4: Manual check**

Run: `pnpm dev`
Expected: move pieces across faces.

---

### Task 11: Rotation UI and ability execution (corner-only)

**Files:**
- Create: `src/ui/hud.ts`
- Modify: `src/main.ts`

**Step 1: Add minimal HUD**

- Buttons for:
  - `Bishop FaceTurn CW/CCW` (enabled only when selected eligible piece)
  - `Rook LayerTurn Row/Col + CW/CCW`
  - `Reset`

**Step 2: Hook buttons to rules**

- Call `applyAbility` and re-render.

**Step 3: Manual check**

Rotate faces and observe pieces moving accordingly.

---

### Task 12: E2E smoke test for move + rotate

**Files:**
- Modify: `e2e/smoke.spec.ts`

**Step 1: Write a deterministic camera + click sequence**

- Ensure camera and board orientation are fixed.
- Click a known starting square with a corner piece.
- Trigger one ability.
- Take a screenshot.

**Step 2: Run Playwright**

Run: `npx playwright test`
Expected: PASS locally.

---

# Execution choice

Plan complete and saved to `docs/plans/2026-02-25-rubicks-chess-mvp-implementation-plan.md`.

Two execution options:

1. **Subagent-Driven (this session)** — dispatch a fresh subagent per task, review between tasks.
2. **Parallel Session (separate)** — open a new session using executing-plans and run tasks with checkpoints.

Which approach do you want?
