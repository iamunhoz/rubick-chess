# Handoff Summary (2026-02-26)

## Context
Project: /home/iamunhoz/code/projects/rubicks-chess  
Default branch: main  
Worktrees are used under .worktrees/ and are ignored by git.  
Network instability (EAI_AGAIN) when running pnpm install in new worktrees.

## Completed Changes (merged to main)
1. Piece height scaling by kind  
   - Added heightScaleFor in src/render/pieces.ts  
   - Applied Y-only scaling after footprint normalization  
   - Test: src/render/pieces.test.ts  
   - Commits: edd0287, 0547dc2

2. Initial layout + pawn forwardDir  
   - New initial placement on F/B faces  
   - Pawns on edge-internal squares (no corners)  
   - King/Queen in middle four, others on corners + remaining middle  
   - Pawn forwardDir stored on Piece (toward face center)  
   - Updated moves to use forwardDir  
   - Tests updated in src/rules/setup.test.ts  
   - Commit: 7b8c93e (merged)

3. Fix face turn piece disappearance  
   - Root cause: turnFace mutating board during iteration, deleting moved pieces  
   - Fix: two-phase (collect moves, clear affected, apply moves)  
   - Test added: preserves piece count on full board in src/rules/turns.test.ts  
   - Commit: a4ee76d

4. Clear selection on empty click  
   - Added onEmptyClick callback in createScene  
   - main.ts clears selection/highlights/bubble on empty click  
   - Commit: 0a4788f (merged)

5. Background gradient  
   - Replaced flat dark background with canvas gradient  
   - Colors: #6f778a (top) -> #2f3547 (bottom)  
   - Code in src/render/scene.ts  
   - Commit: c6f280d (merged)

## Open Items / Next Work
User request (paused): Make black piece outlines brighter than body.  
- Hover outline should remain as-is.  
- Target: always-on silhouette for black pieces only.  
- Proposed approach: allow createPieceSilhouette to accept color/opacity overrides; use brighter color for black pieces.  
- Pending confirmation of exact values (suggested: color #5d667c, opacity 0.55). User paused before confirming values.

## Design/Plan Status
- Brainstorming in progress for silhouette brightness change.  
- No design doc or plan created yet for this change (pending user confirmation of values).

## Known Repo State
- main has .pnpm-store/ and docs/plans/2026-02-26-initial-layout-plan.md untracked; user chose to leave untracked.

## Commands / Notes
- Tests typically run with pnpm test  
- Some worktrees couldn’t install deps due to EAI_AGAIN; user manually ran pnpm install when needed.
