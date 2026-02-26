import { getPiece } from "./board";
import { step } from "./topology";
import { turnFace, type TurnDir } from "./turns";
import type { Board } from "./board";
import type { Face, Pos } from "./types";

export type Ability =
  | { kind: "FaceTurn"; from: Pos; dir: TurnDir }
  | { kind: "LayerTurn"; from: Pos; axis: "row" | "col"; dir: TurnDir };

export function isCorner(pos: Pos): boolean {
  return (
    (pos.r === 0 || pos.r === 3) &&
    (pos.c === 0 || pos.c === 3)
  );
}

function adjacentFaceForAxis(pos: Pos, axis: "row" | "col"): Face {
  if (axis === "row") {
    const dir = pos.r === 0 ? "N" : "S";
    return step(pos, dir).to.face;
  }
  const dir = pos.c === 0 ? "W" : "E";
  return step(pos, dir).to.face;
}

export function applyAbility(board: Board, ability: Ability): Board {
  const piece = getPiece(board, ability.from);
  if (piece === null) return board;
  if (!isCorner(ability.from)) return board;

  if (ability.kind === "FaceTurn") {
    if (piece.kind !== "B" && piece.kind !== "Q") return board;
    return turnFace(board, ability.from.face, ability.dir);
  }

  // LayerTurn
  if (piece.kind !== "R" && piece.kind !== "Q") return board;
  const face = adjacentFaceForAxis(ability.from, ability.axis);
  return turnFace(board, face, ability.dir);
}

