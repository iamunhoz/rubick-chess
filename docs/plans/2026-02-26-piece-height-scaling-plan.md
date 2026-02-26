# Piece Height Scaling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make chess pieces visually distinct by height using a Queen-based scale table.

**Architecture:** Keep existing voxel models and footprint normalization. Add a per-piece height scale mapping and apply a Y-only multiplier after footprint normalization so tile occupancy stays consistent.

**Tech Stack:** TypeScript, Three.js, Vitest (unit tests), Vite.

---

### Task 1: Add Height Scale Mapping Test

**Files:**
- Create: `src/render/pieces.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { heightScaleFor } from "./pieces";

describe("heightScaleFor", () => {
  it("returns the expected Queen-based scale table", () => {
    expect(heightScaleFor("Q")).toBeCloseTo(1.0, 5);
    expect(heightScaleFor("K")).toBeCloseTo(0.97, 5);
    expect(heightScaleFor("R")).toBeCloseTo(0.88, 5);
    expect(heightScaleFor("B")).toBeCloseTo(0.88, 5);
    expect(heightScaleFor("N")).toBeCloseTo(0.8, 5);
    expect(heightScaleFor("P")).toBeCloseTo(0.7, 5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/render/pieces.test.ts`
Expected: FAIL with "heightScaleFor is not exported" or similar.

**Step 3: Commit**

```bash
git add src/render/pieces.test.ts
git commit -m "test: add piece height scale expectations"
```

---

### Task 2: Implement Height Scaling in Piece Models

**Files:**
- Modify: `src/render/pieces.ts`
- Test: `src/render/pieces.test.ts`

**Step 1: Write minimal implementation**

Add the mapping and export a helper, then apply Y-only scale after footprint normalization:

```ts
type ModelKey = `${Color}:${PieceKind}`;

const heightScaleByKind: Record<PieceKind, number> = {
  Q: 1.0,
  K: 0.97,
  R: 0.88,
  B: 0.88,
  N: 0.8,
  P: 0.7,
};

export function heightScaleFor(kind: PieceKind): number {
  return heightScaleByKind[kind] ?? 1.0;
}
```

Then, after:

```ts
g.scale.setScalar(s);
```

add:

```ts
  const heightScale = heightScaleFor(kind);
  g.scale.y *= heightScale;
```

**Step 2: Run test to verify it passes**

Run: `pnpm test -- src/render/pieces.test.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/render/pieces.ts src/render/pieces.test.ts
git commit -m "feat: scale piece heights by kind"
```

---

### Task 3: Smoke Test Locally (Optional)

**Files:**
- None

**Step 1: Run dev server**

Run: `pnpm dev`
Expected: Dev server starts; visually confirm height differences align with the scale table.

**Step 2: Commit**

No commit needed unless additional adjustments are made.
