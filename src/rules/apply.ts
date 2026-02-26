import { getPiece, setPiece } from "./board";
import type { Board } from "./board";
import type { Pos } from "./types";

export function applyMove(board: Board, from: Pos, to: Pos): Board {
  const piece = getPiece(board, from);
  if (piece === null) return board;

  let nextPiece = piece;

  if (piece.kind === "P") {
    const facesCrossed = (piece.facesCrossed ?? 0) + (from.face === to.face ? 0 : 1);
    if (facesCrossed >= 2) {
      nextPiece = { ...piece, kind: "Q", facesCrossed: undefined };
    } else {
      nextPiece = { ...piece, facesCrossed };
    }
  }

  let next = board;
  next = setPiece(next, from, null);
  next = setPiece(next, to, nextPiece);
  return next;
}

