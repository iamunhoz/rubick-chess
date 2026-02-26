import { describe, expect, it } from "vitest";

import { applyMove } from "./apply";
import { createEmptyBoard, getPiece, setPiece } from "./board";
import { step } from "./topology";
import type { Pos } from "./types";

describe("apply.applyMove", () => {
  it("moves piece from->to", () => {
    let board = createEmptyBoard();
    const from: Pos = { face: "F", r: 1, c: 1 };
    const to: Pos = { face: "F", r: 1, c: 2 };
    board = setPiece(board, from, { id: "wr1", color: "W", kind: "R" });

    const next = applyMove(board, from, to);
    expect(getPiece(next, from)).toBeNull();
    expect(getPiece(next, to)?.id).toBe("wr1");
  });

  it("captures opponent on destination", () => {
    let board = createEmptyBoard();
    const from: Pos = { face: "F", r: 1, c: 1 };
    const to: Pos = { face: "F", r: 1, c: 2 };
    board = setPiece(board, from, { id: "wr1", color: "W", kind: "R" });
    board = setPiece(board, to, { id: "bp1", color: "B", kind: "P" });

    const next = applyMove(board, from, to);
    expect(getPiece(next, to)?.id).toBe("wr1");
  });

  it("increments pawn facesCrossed only when crossing faces", () => {
    let board = createEmptyBoard();
    const from: Pos = { face: "F", r: 3, c: 0 };
    const toSameFace: Pos = { face: "F", r: 2, c: 0 };
    const toOtherFace = step(from, "S").to;
    board = setPiece(board, from, { id: "wp1", color: "W", kind: "P", facesCrossed: 0 });

    const a = applyMove(board, from, toSameFace);
    expect(getPiece(a, toSameFace)?.facesCrossed).toBe(0);

    const b = applyMove(a, toSameFace, toOtherFace);
    expect(getPiece(b, toOtherFace)?.facesCrossed).toBe(1);
  });

  it("promotes pawn after 2 crossings", () => {
    let board = createEmptyBoard();
    const start: Pos = { face: "F", r: 3, c: 0 };
    board = setPiece(board, start, { id: "wp1", color: "W", kind: "P", facesCrossed: 1 });

    const aTo = step(start, "S").to;
    const a = applyMove(board, start, aTo);
    const promoted = getPiece(a, aTo);
    expect(promoted?.kind).toBe("Q");
    expect(promoted?.facesCrossed).toBeUndefined();
  });
});

