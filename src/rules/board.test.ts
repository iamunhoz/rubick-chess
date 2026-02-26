import { describe, expect, it } from "vitest";

import { createEmptyBoard, getPiece, setPiece } from "./board";

describe("board", () => {
  it("starts empty", () => {
    const board = createEmptyBoard();
    expect(getPiece(board, { face: "F", r: 0, c: 0 })).toBeNull();
  });

  it("sets and gets pieces", () => {
    const board = createEmptyBoard();
    const board2 = setPiece(board, { face: "F", r: 1, c: 2 }, { kind: "P", color: "W", id: "wp1" });
    expect(getPiece(board2, { face: "F", r: 1, c: 2 })?.kind).toBe("P");
  });
});

