import Mousetrap from "mousetrap";
import type { SnapPreset } from "./render/camera";

export type KeyboardCallbacks = {
  // Piece selection
  selectNextPiece: () => void;
  selectPrevPiece: () => void;
  deselect: () => void;

  // Move navigation
  nextMoveTarget: () => void;
  prevMoveTarget: () => void;
  confirmMove: () => void;

  // Camera
  snapTo: (preset: SnapPreset) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Abilities (1-6)
  triggerAbility: (index: number) => void;

  // Menu
  toggleHud: () => void;
  resetGame: () => void;
};

export function bindKeyboard(cb: KeyboardCallbacks): () => void {
  // --- Piece selection ---
  Mousetrap.bind("tab", (e) => {
    e.preventDefault();
    cb.selectNextPiece();
  });
  Mousetrap.bind("shift+tab", (e) => {
    e.preventDefault();
    cb.selectPrevPiece();
  });
  Mousetrap.bind("escape", () => cb.deselect());

  // --- Move navigation ---
  Mousetrap.bind("right", (e) => {
    e.preventDefault();
    cb.nextMoveTarget();
  });
  Mousetrap.bind("left", (e) => {
    e.preventDefault();
    cb.prevMoveTarget();
  });
  Mousetrap.bind("enter", (e) => {
    e.preventDefault();
    cb.confirmMove();
  });
  Mousetrap.bind("space", (e) => {
    e.preventDefault();
    cb.confirmMove();
  });

  // --- Camera snaps ---
  const snaps: [string, SnapPreset][] = [
    ["f", "F"], ["b", "B"], ["l", "L"], ["r", "R"],
    ["u", "U"], ["d", "D"], ["i", "I"],
  ];
  for (const [key, preset] of snaps) {
    Mousetrap.bind(key, () => cb.snapTo(preset));
  }

  // --- Camera zoom ---
  Mousetrap.bind(["=", "+"], (e) => {
    e.preventDefault();
    cb.zoomIn();
  });
  Mousetrap.bind("-", (e) => {
    e.preventDefault();
    cb.zoomOut();
  });

  // --- Abilities (1-6) ---
  for (let n = 1; n <= 6; n++) {
    Mousetrap.bind(String(n), () => cb.triggerAbility(n));
  }

  // --- Menu ---
  Mousetrap.bind("h", () => cb.toggleHud());
  Mousetrap.bind("backspace", (e) => {
    e.preventDefault();
    cb.resetGame();
  });

  return () => Mousetrap.reset();
}
