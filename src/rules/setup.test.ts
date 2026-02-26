import { describe, expect, it } from "vitest";

import { createInitialGame } from "./setup";
import { getPiece } from "./board";

describe("setup.createInitialGame", () => {
  it("creates 32 pieces on two faces", () => {
    const game = createInitialGame();
    let count = 0;
    for (const piece of game.board.pieces.values()) count++;
    expect(count).toBe(32);
  });

  it("places white back rank pieces on F row 0/1", () => {
    const { board } = createInitialGame();
    expect(getPiece(board, { face: "F", r: 0, c: 0 })?.kind).toBe("R");
    expect(getPiece(board, { face: "F", r: 0, c: 1 })?.kind).toBe("N");
    expect(getPiece(board, { face: "F", r: 0, c: 2 })?.kind).toBe("B");
    expect(getPiece(board, { face: "F", r: 0, c: 3 })?.kind).toBe("Q");
    expect(getPiece(board, { face: "F", r: 1, c: 0 })?.kind).toBe("K");
  });

  it("places pawns on rows 2 and 3", () => {
    const { board } = createInitialGame();
    expect(getPiece(board, { face: "F", r: 2, c: 0 })?.kind).toBe("P");
    expect(getPiece(board, { face: "F", r: 3, c: 3 })?.kind).toBe("P");
    expect(getPiece(board, { face: "B", r: 2, c: 0 })?.kind).toBe("P");
    expect(getPiece(board, { face: "B", r: 3, c: 3 })?.kind).toBe("P");
  });
});

