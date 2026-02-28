# Empty Click Clears Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clear selection, highlights, and ability bubble when the user left-clicks empty space on the board.

**Architecture:** Extend `createScene` with an `onEmptyClick` callback and trigger it on left-clicks that hit neither a piece nor a tile. In `main.ts`, wire the callback to clear selection/highlights and rebuild the bubble.

**Tech Stack:** TypeScript, Three.js, Vite.

---

### Task 1: Add Empty-Click Callback Wiring (Testless UI Change)

**Files:**
- Modify: `src/render/scene.ts`
- Modify: `src/main.ts`

**Step 1: Write the failing test**

No automated UI test (manual verification only).

**Step 2: Implement minimal code**

In `src/render/scene.ts`, extend options and call `onEmptyClick` when no hits:

```ts
export function createScene(
  container: HTMLElement,
  getBoard: () => Board,
  opts?: { onTileClick?: (pos: Pos) => void; onEmptyClick?: () => void },
): SceneApi {
  // ...
  renderer.domElement.addEventListener("pointerdown", (ev: PointerEvent) => {
    // ...
    const pieceHits = raycaster.intersectObjects(pieceRoots, true);
    if (pieceHits.length > 0) {
      // existing selection code
      return;
    }

    const hits = raycaster.intersectObjects([...tiles.values()], false);
    if (hits.length === 0) {
      opts?.onEmptyClick?.();
      return;
    }
    // existing tile selection code
  });
}
```

In `src/main.ts`, pass `onEmptyClick` to clear selection and highlights and rebuild bubble:

```ts
const scene = createScene(viewport, () => game.board, {
  onTileClick: (pos) => {
    // existing logic
  },
  onEmptyClick: () => {
    if (isAnimating) return;
    selection = null;
    selectionMoves = [];
    scene.setSelected(null);
    scene.setHighlights([]);
    hud.sync();
    rebuildBubble();
  },
});
```

**Step 3: Run manual verification**

Run: `pnpm dev`
- Select a piece (bubble visible)
- Left-click empty space → selection cleared, highlights removed, bubble hidden

**Step 4: Commit**

```bash
git add src/render/scene.ts src/main.ts
git commit -m "feat: clear selection on empty click"
```
