import { getPiece } from "./board";
import { step } from "./topology";
import type { Board } from "./board";
import type { Color, Dir, Piece, Pos } from "./types";

type Diag = "NE" | "NW" | "SE" | "SW";

function isSamePos(a: Pos, b: Pos): boolean {
  return a.face === b.face && a.r === b.r && a.c === b.c;
}

function canLandOn(board: Board, to: Pos, mover: Piece): "empty" | "capture" | "blocked" {
  const target = getPiece(board, to);
  if (target === null) return "empty";
  if (target.color !== mover.color) return "capture";
  return "blocked";
}

function stepDiag(pos: Pos, diag: Diag): { to: Pos; crossedFace: boolean } {
  const [d1, d2]: [Dir, Dir] =
    diag === "NE"
      ? ["N", "E"]
      : diag === "NW"
        ? ["N", "W"]
        : diag === "SE"
          ? ["S", "E"]
          : ["S", "W"];

  const a = step(pos, d1);
  const b = step(a.to, d2);
  return { to: b.to, crossedFace: a.crossedFace || b.crossedFace };
}

function slide(
  board: Board,
  from: Pos,
  mover: Piece,
  next: (pos: Pos) => Pos,
  limit: number,
): Pos[] {
  const moves: Pos[] = [];
  let cur = from;
  const visited = new Set<string>([`${from.face}:${from.r}:${from.c}`]);

  for (let i = 0; i < limit; i++) {
    cur = next(cur);
    const key = `${cur.face}:${cur.r}:${cur.c}`;
    if (visited.has(key)) break;
    visited.add(key);

    const landing = canLandOn(board, cur, mover);
    if (landing === "blocked") break;
    moves.push(cur);
    if (landing === "capture") break;
  }

  return moves;
}

function pawnForwardDir(_color: Color, piece?: Piece): Dir {
  if (piece?.forwardDir) return piece.forwardDir;
  // MVP: allow pawns to move immediately off their starting face edge (row 3).
  // We’ll revisit per-color orientation when we add turns/check rules.
  return "S";
}

function perpendicularDirs(dir: Dir): [Dir, Dir] {
  return dir === "N" || dir === "S" ? ["W", "E"] : ["N", "S"];
}

function pushUnique(into: Pos[], pos: Pos): void {
  if (!into.some((p) => isSamePos(p, pos))) into.push(pos);
}

export function legalMoves(board: Board, from: Pos): Pos[] {
  const piece = getPiece(board, from);
  if (piece === null) return [];

  const result: Pos[] = [];

  if (piece.kind === "R" || piece.kind === "Q") {
    for (const dir of ["N", "E", "S", "W"] as const) {
      const next = (p: Pos) => step(p, dir).to;
      for (const m of slide(board, from, piece, next, 96)) pushUnique(result, m);
    }
  }

  if (piece.kind === "B" || piece.kind === "Q") {
    for (const diag of ["NE", "NW", "SE", "SW"] as const) {
      const next = (p: Pos) => stepDiag(p, diag).to;
      for (const m of slide(board, from, piece, next, 96)) pushUnique(result, m);
    }
  }

  if (piece.kind === "K") {
    for (const dir of ["N", "E", "S", "W"] as const) {
      const to = step(from, dir).to;
      const landing = canLandOn(board, to, piece);
      if (landing !== "blocked") pushUnique(result, to);
    }
    for (const diag of ["NE", "NW", "SE", "SW"] as const) {
      const to = stepDiag(from, diag).to;
      const landing = canLandOn(board, to, piece);
      if (landing !== "blocked") pushUnique(result, to);
    }
  }

  if (piece.kind === "N") {
    const sequences: Dir[][] = [
      ["N", "N", "E"],
      ["N", "N", "W"],
      ["S", "S", "E"],
      ["S", "S", "W"],
      ["E", "E", "N"],
      ["E", "E", "S"],
      ["W", "W", "N"],
      ["W", "W", "S"],
    ];

    for (const seq of sequences) {
      let cur = from;
      for (const d of seq) cur = step(cur, d).to;
      const landing = canLandOn(board, cur, piece);
      if (landing !== "blocked") pushUnique(result, cur);
    }
  }

  if (piece.kind === "P") {
    const forwardDir = pawnForwardDir(piece.color, piece);
    const forward = step(from, forwardDir).to;
    if (getPiece(board, forward) === null) pushUnique(result, forward);

    const [leftDir, rightDir] = perpendicularDirs(forwardDir);
    const diagLeft = step(step(from, forwardDir).to, leftDir).to;
    const diagRight = step(step(from, forwardDir).to, rightDir).to;

    for (const diag of [diagLeft, diagRight]) {
      const target = getPiece(board, diag);
      if (target !== null && target.color !== piece.color) pushUnique(result, diag);
    }
  }

  return result;
}
