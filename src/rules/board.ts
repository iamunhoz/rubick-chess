import type { Piece, Pos } from "./types";

export type Board = Readonly<{
  pieces: ReadonlyMap<string, Piece>;
}>;

function keyOf(pos: Pos): string {
  return `${pos.face}:${pos.r}:${pos.c}`;
}

export function createEmptyBoard(): Board {
  return { pieces: new Map() };
}

export function getPiece(board: Board, pos: Pos): Piece | null {
  return board.pieces.get(keyOf(pos)) ?? null;
}

export function setPiece(board: Board, pos: Pos, piece: Piece | null): Board {
  const nextPieces = new Map(board.pieces);
  const key = keyOf(pos);
  if (piece === null) nextPieces.delete(key);
  else nextPieces.set(key, piece);
  return { pieces: nextPieces };
}

