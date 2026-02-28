# Plan: Replace voxel pieces with GLB models (2026-02-28)

## Goals
- Load the realistic chess set from `assets/Chess.glb` once, cache typed prototypes, and clone per piece.
- Replace the existing voxel scaffolding (models, outlines, silhouettes) with GLB-based equivalents while keeping selection/animation flows intact.
- Ensure both colors render (derive black materials at runtime when only white meshes exist).
- Keep build + test passing; follow XO’s workflow rule (merge back to `main` after feature commit and push).

## Steps
1. **Loader + Typings**
   - Add `@types/three` and custom declarations for GLTFLoader/SkeletonUtils so TS has rich types for future automation.
   - Replace `src/types/three.d.ts` shim; update `tsconfig.json` `types` array to include `three` so new declarations flow everywhere.

2. **Piece Module Rewrite**
   - Rebuild `src/render/pieces.ts` around `GLTFLoader`: preload `Chess.glb`, map meshes → `PieceKind`, normalize prototypes (center, scale, color variants), and expose `getPieceModel`, `createPieceOutline`, `createPieceSilhouette` using cloned meshes.
   - Export `__pieceInternals` (`assignPieceKinds`, `createBlackMaterialVariant`) for targeted tests.

3. **Scene Integration**
   - Make `createScene` async, await `preloadPieceModels`, and update `main.ts` to `await createScene(...)` so the UI initializes after the GLB cache is ready.

4. **Tests + Build**
   - Keep the new Vitest coverage for mapping + material variants, run the full suite, and run `pnpm build` to ensure bundling succeeds with the GLB asset.

5. **Git Workflow**
   - Commit changes on `feature/glb-pieces`, merge into `main`, and push both branches.
