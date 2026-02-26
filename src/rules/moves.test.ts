import { describe, expect, it } from "vitest";

import { createEmptyBoard, setPiece } from "./board";
import { legalMoves } from "./moves";
import { step } from "./topology";
import type { Pos } from "./types";

describe("moves.legalMoves", () => {
  it("returns [] for empty square", () => {
    const board = createEmptyBoard();
    expect(legalMoves(board, { face: "F", r: 0, c: 0 })).toEqual([]);
  });

  it("rook slides in cardinal directions (unblocked)", () => {
    let board = createEmptyBoard();
    board = setPiece(board, { face: "F", r: 1, c: 1 }, { id: "wr1", color: "W", kind: "R" });

    const moves = legalMoves(board, { face: "F", r: 1, c: 1 });
    expect(moves.length).toBeGreaterThan(0);

    const expectedOneStepNorth = step({ face: "F", r: 1, c: 1 }, "N").to;
    expect(moves).toContainEqual(expectedOneStepNorth);
  });

  it("rook can cross faces when sliding off an edge", () => {
    let board = createEmptyBoard();
    const from: Pos = { face: "F", r: 0, c: 0 };
    board = setPiece(board, from, { id: "wr1", color: "W", kind: "R" });

    const moves = legalMoves(board, from);
    const crosses = moves.some((p) => p.face !== from.face);
    expect(crosses).toBe(true);
  });

  it("captures stop sliding", () => {
    let board = createEmptyBoard();
    const from: Pos = { face: "F", r: 2, c: 2 };
    board = setPiece(board, from, { id: "wr1", color: "W", kind: "R" });

    const block = step(from, "N").to;
    const beyond = step(block, "N").to;
    board = setPiece(board, block, { id: "bp1", color: "B", kind: "P" });

    const moves = legalMoves(board, from);
    expect(moves).toContainEqual(block);
    expect(moves).not.toContainEqual(beyond);
  });

  it("pawn moves forward into empty square", () => {
    let board = createEmptyBoard();
    const from: Pos = { face: "F", r: 3, c: 1 };
    board = setPiece(board, from, { id: "wp1", color: "W", kind: "P", facesCrossed: 0 });

    const forward = step(from, "S").to;
    const moves = legalMoves(board, from);
    expect(moves).toContainEqual(forward);
  });

  it("pawn captures diagonally", () => {
    let board = createEmptyBoard();
    const from: Pos = { face: "F", r: 3, c: 1 };
    board = setPiece(board, from, { id: "wp1", color: "W", kind: "P", facesCrossed: 0 });

    const forward = step(from, "S").to;
    const diag = step(forward, "E").to;
    board = setPiece(board, diag, { id: "bn1", color: "B", kind: "N" });

    const moves = legalMoves(board, from);
    expect(moves).toContainEqual(diag);
  });
});

