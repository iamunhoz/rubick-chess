import { createEmptyBoard, setPiece } from "./board";
import type { Board } from "./board";
import type { Color, Dir, Face, PieceKind, RC } from "./types";

export type GameState = {
  board: Board;
};

const pawnSquares = [
  [0, 1],
  [0, 2],
  [3, 1],
  [3, 2],
  [1, 0],
  [2, 0],
  [1, 3],
  [2, 3],
] as const;

const kingSquare: [number, number] = [1, 1];
const queenSquare: [number, number] = [2, 2];
const knightSquares: Array<[number, number]> = [
  [1, 2],
  [2, 1],
];
const rookSquares: Array<[number, number]> = [
  [0, 0],
  [3, 3],
];
const bishopSquares: Array<[number, number]> = [
  [0, 3],
  [3, 0],
];

function pieceId(color: Color, kind: PieceKind, face: Face, r: number, c: number): string {
  return `${color}${kind}-${face}-${r}-${c}`;
}

function pawnForwardDir(r: number, c: number): Dir {
  if (r === 0) return "S";
  if (r === 3) return "N";
  if (c === 0) return "E";
  return "W";
}

function placeFace(board: Board, face: Face, color: Color): Board {
  let next = board;

  for (const [r, c] of pawnSquares) {
    const kind: PieceKind = "P";
    const piece = {
      id: pieceId(color, kind, face, r, c),
      color,
      kind,
      facesCrossed: 0,
      forwardDir: pawnForwardDir(r, c),
    };
    next = setPiece(next, { face, r: r as RC, c: c as RC }, piece);
  }

  const placeMajor = (kind: PieceKind, r: number, c: number): void => {
    const piece = { id: pieceId(color, kind, face, r, c), color, kind };
    next = setPiece(next, { face, r: r as RC, c: c as RC }, piece);
  };

  placeMajor("K", kingSquare[0], kingSquare[1]);
  placeMajor("Q", queenSquare[0], queenSquare[1]);

  for (const [r, c] of knightSquares) placeMajor("N", r, c);
  for (const [r, c] of rookSquares) placeMajor("R", r, c);
  for (const [r, c] of bishopSquares) placeMajor("B", r, c);

  return next;
}

export function createInitialGame(): GameState {
  let board = createEmptyBoard();
  board = placeFace(board, "F", "W");
  board = placeFace(board, "B", "B");
  return { board };
}
