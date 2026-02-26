import { createEmptyBoard, setPiece } from "./board";
import type { Board } from "./board";
import type { Color, Face, PieceKind } from "./types";

export type GameState = {
  board: Board;
};

const layout: PieceKind[][] = [
  ["R", "N", "B", "Q"],
  ["K", "B", "N", "R"],
  ["P", "P", "P", "P"],
  ["P", "P", "P", "P"],
];

function pieceId(color: Color, kind: PieceKind, face: Face, r: number, c: number): string {
  return `${color}${kind}-${face}-${r}-${c}`;
}

function placeFace(board: Board, face: Face, color: Color): Board {
  let next = board;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const kind = layout[r]?.[c];
      if (!kind) continue;
      const piece =
        kind === "P"
          ? { id: pieceId(color, kind, face, r, c), color, kind, facesCrossed: 0 }
          : { id: pieceId(color, kind, face, r, c), color, kind };
      next = setPiece(next, { face, r: r as 0 | 1 | 2 | 3, c: c as 0 | 1 | 2 | 3 }, piece);
    }
  }
  return next;
}

export function createInitialGame(): GameState {
  let board = createEmptyBoard();
  board = placeFace(board, "F", "W");
  board = placeFace(board, "B", "B");
  return { board };
}

