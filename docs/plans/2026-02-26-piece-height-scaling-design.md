# Rubicks Chess — Piece Height Scaling Design (2026-02-26)

## Goal
Make chess pieces more visually distinct by height, with the Queen as the baseline and other pieces scaled relative to her.

## Approach (Approved)
**Y-only height scaling after footprint normalization.**
- Keep existing voxel models and footprints intact.
- Apply a per-piece Y-scale multiplier after the current footprint normalization step so tile occupancy stays consistent.

## Height Scale Mapping
Baseline: **Queen = 1.00**
- King: **0.97** (slightly shorter than Queen)
- Rook: **0.88**
- Bishop: **0.88**
- Knight: **0.80**
- Pawn: **0.70**

## Implementation Plan (High Level)
- Update `src/render/pieces.ts` to add a `heightScaleByKind` mapping.
- After the existing `g.scale.setScalar(s)` call, apply the Y-only multiplier: `g.scale.y *= heightScale`.
- Default to `1.0` if a piece kind is missing from the mapping.

## Data Flow
Voxel build → center & lift to y=0 → normalize footprint → apply Y-scale multiplier → return model.

## Error Handling
If a piece kind is missing from the mapping, default to `1.0` to avoid distortions.

## Testing
No automated tests. Verify visually in `pnpm dev` by confirming height differences match the scale table.
