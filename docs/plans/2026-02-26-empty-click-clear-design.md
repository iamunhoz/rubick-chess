# Rubicks Chess — Clear Selection on Empty Click (2026-02-26)

## Goal
Left-clicking empty space on the board should clear the current selection, remove move highlights, and close the floating ability bubble.

## Approach (Approved)
Handle empty clicks inside the scene raycast logic and forward them via a new `onEmptyClick` callback to the main controller.

## Architecture
- Extend `createScene` options with `onEmptyClick?: () => void`.
- In `scene.ts`, when a left-click hits neither piece nor tile, invoke `onEmptyClick`.
- In `main.ts`, implement `onEmptyClick` to clear selection, clear highlights, and rebuild the bubble.

## Components
- `src/render/scene.ts`: add empty-click callback and trigger it.
- `src/main.ts`: wire callback to clear selection/highlights and update UI.

## Data Flow
Left-click empty canvas → scene raycast finds no hits → `onEmptyClick()` → clear selection + highlights → `rebuildBubble()`.

## Error Handling
If `onEmptyClick` is not provided, do nothing.

## Testing
Manual verification in `pnpm dev`:
- Click a piece to select (bubble visible).
- Left-click empty space → selection cleared, highlights removed, bubble hidden.
