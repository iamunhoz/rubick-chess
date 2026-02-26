import { describe, expect, it } from "vitest";

import { applyAbility, isCorner, type Ability } from "./abilities";
import { createEmptyBoard, getPiece, setPiece } from "./board";
import { createInitialGame } from "./setup";
import { step } from "./topology";
import { turnFace } from "./turns";
import type { Pos } from "./types";

function findPiecePosById(board: { pieces: ReadonlyMap<string, { id: string }> }, id: string): Pos | null {
  for (const [key, piece] of board.pieces.entries()) {
    if (piece.id !== id) continue;
    const [face, r, c] = key.split(":");
    return { face: face as Pos["face"], r: Number(r) as Pos["r"], c: Number(c) as Pos["c"] };
  }
  return null;
}

describe("abilities", () => {
  it("detects corners", () => {
    expect(isCorner({ face: "F", r: 0, c: 0 })).toBe(true);
    expect(isCorner({ face: "F", r: 1, c: 0 })).toBe(false);
    expect(isCorner({ face: "F", r: 3, c: 3 })).toBe(true);
  });

  it("bishop on corner can turn its own face", () => {
    let board = createEmptyBoard();
    const pos: Pos = { face: "F", r: 0, c: 0 };
    board = setPiece(board, pos, { id: "wb1", color: "W", kind: "B" });

    const ability: Ability = { kind: "FaceTurn", from: pos, dir: "CW" };
    const a = applyAbility(board, ability);
    const b = turnFace(board, "F", "CW");
    expect(a).toEqual(b);
  });

  it("rook on corner can turn adjacent face by row/col choice", () => {
    let board = createEmptyBoard();
    const pos: Pos = { face: "F", r: 0, c: 0 };
    board = setPiece(board, pos, { id: "wr1", color: "W", kind: "R" });

    const rowFace = step(pos, "N").to.face;
    const colFace = step(pos, "W").to.face;

    const aRow = applyAbility(board, { kind: "LayerTurn", from: pos, axis: "row", dir: "CCW" });
    expect(aRow).toEqual(turnFace(board, rowFace, "CCW"));

    const aCol = applyAbility(board, { kind: "LayerTurn", from: pos, axis: "col", dir: "CW" });
    expect(aCol).toEqual(turnFace(board, colFace, "CW"));
  });

  it("layer turn from starting rook changes the game state", () => {
    const game = createInitialGame();
    const from: Pos = { face: "F", r: 0, c: 0 };
    const rookId = "WR-F-0-0";

    const before = findPiecePosById(game.board, rookId);
    expect(before).toEqual(from);

    const afterBoard = applyAbility(game.board, { kind: "LayerTurn", from, axis: "row", dir: "CW" });
    const after = findPiecePosById(afterBoard, rookId);
    expect(after).not.toBeNull();
    expect(after).not.toEqual(from);

    expect(afterBoard.pieces.size).toBe(32);
  });

  it("queen on corner can do both", () => {
    let board = createEmptyBoard();
    const pos: Pos = { face: "F", r: 0, c: 0 };
    board = setPiece(board, pos, { id: "wq", color: "W", kind: "Q" });

    const a = applyAbility(board, { kind: "FaceTurn", from: pos, dir: "CW" });
    expect(a).toEqual(turnFace(board, "F", "CW"));

    // Make layer turn observable by placing another piece on the affected face.
    const rowFace = step(pos, "N").to.face;
    board = setPiece(board, { face: rowFace, r: 0, c: 0 }, { id: "x", color: "B", kind: "P" });

    const b = applyAbility(board, { kind: "LayerTurn", from: pos, axis: "row", dir: "CW" });
    expect(b).toEqual(turnFace(board, rowFace, "CW"));
  });

  it("non-corner cannot use abilities", () => {
    let board = createEmptyBoard();
    const pos: Pos = { face: "F", r: 1, c: 1 };
    board = setPiece(board, pos, { id: "wb1", color: "W", kind: "B" });

    const next = applyAbility(board, { kind: "FaceTurn", from: pos, dir: "CW" });
    expect(next).toEqual(board);
  });
});
