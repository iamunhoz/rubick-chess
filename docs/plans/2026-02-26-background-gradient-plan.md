# Background Gradient Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the dark flat scene background with a lighter vertical gradient to improve contrast.

**Architecture:** Generate a tiny vertical gradient canvas and set `scene.background` to a `CanvasTexture` built from it.

**Tech Stack:** TypeScript, Three.js.

---

### Task 1: Apply Gradient Background

**Files:**
- Modify: `src/render/scene.ts`

**Step 1: Write the failing test**

No automated test (manual verification only).

**Step 2: Implement minimal code**

Replace the flat background in `createScene` with a canvas-generated gradient:

```ts
  const scene = new THREE.Scene();

  const gradientCanvas = document.createElement("canvas");
  gradientCanvas.width = 2;
  gradientCanvas.height = 256;
  const gctx = gradientCanvas.getContext("2d");
  if (gctx) {
    const grad = gctx.createLinearGradient(0, 0, 0, gradientCanvas.height);
    grad.addColorStop(0, "#6f778a");
    grad.addColorStop(1, "#2f3547");
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
    const tex = new THREE.CanvasTexture(gradientCanvas);
    tex.needsUpdate = true;
    scene.background = tex;
  } else {
    scene.background = new THREE.Color(0x2f3547);
  }
```

**Step 3: Run manual verification**

Run: `pnpm dev`
- Confirm black pieces are more legible against the new gradient.

**Step 4: Commit**

```bash
git add src/render/scene.ts
git commit -m "feat: add gradient background"
```
