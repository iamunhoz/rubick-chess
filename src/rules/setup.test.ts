import { describe, expect, it } from "vitest";

import { createInitialGame } from "./setup";
import { getPiece } from "./board";

const pawnSquares = [
  { r: 0, c: 1 },
  { r: 0, c: 2 },
  { r: 3, c: 1 },
  { r: 3, c: 2 },
  { r: 1, c: 0 },
  { r: 2, c: 0 },
  { r: 1, c: 3 },
  { r: 2, c: 3 },
];

const cornerSquares = [
  { r: 0, c: 0 },
  { r: 0, c: 3 },
  { r: 3, c: 0 },
  { r: 3, c: 3 },
];

describe("setup.createInitialGame", () => {
  it("creates 32 pieces on two faces", () => {
    const game = createInitialGame();
    let count = 0;
    for (const piece of game.board.pieces.values()) count++;
    expect(count).toBe(32);
  });

  it("places pawns on all edge-internal squares (no corners)", () => {
    const { board } = createInitialGame();
    for (const face of ["F", "B"] as const) {
      for (const pos of pawnSquares) {
        expect(getPiece(board, { face, ...pos })?.kind).toBe("P");
      }
      for (const pos of cornerSquares) {
        expect(getPiece(board, { face, ...pos })?.kind).not.toBe("P");
      }
    }
  });

  it("places king/queen in two of the middle four squares", () => {
    const { board } = createInitialGame();
    const middle = [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 2, c: 1 },
      { r: 2, c: 2 },
    ];

    for (const face of ["F", "B"] as const) {
      const kinds = middle
        .map((pos) => getPiece(board, { face, ...pos })?.kind)
        .filter((kind): kind is "K" | "Q" => kind === "K" || kind === "Q");

      expect(kinds.sort()).toEqual(["K", "Q"]);
    }
  });

  it("places rooks, bishops, and knights in remaining squares", () => {
    const { board } = createInitialGame();
    const expectedCorners = ["R", "R", "B", "B"].sort();
    const expectedMiddleOthers = ["N", "N"].sort();

    for (const face of ["F", "B"] as const) {
      const corners = cornerSquares
        .map((pos) => getPiece(board, { face, ...pos })?.kind)
        .filter((kind): kind is "R" | "B" => kind === "R" || kind === "B")
        .sort();
      expect(corners).toEqual(expectedCorners);

      const middleOthers = [
        { r: 1, c: 1 },
        { r: 1, c: 2 },
        { r: 2, c: 1 },
        { r: 2, c: 2 },
      ]
        .map((pos) => getPiece(board, { face, ...pos })?.kind)
        .filter((kind): kind is "N" => kind === "N")
        .sort();
      expect(middleOthers).toEqual(expectedMiddleOthers);
    }
  });

  it("assigns pawn forwardDir toward the face center", () => {
    const { board } = createInitialGame();
    const cases = [
      { face: "F", r: 0, c: 1, dir: "S" },
      { face: "F", r: 3, c: 1, dir: "N" },
      { face: "F", r: 1, c: 0, dir: "E" },
      { face: "F", r: 1, c: 3, dir: "W" },
      { face: "B", r: 0, c: 2, dir: "S" },
      { face: "B", r: 3, c: 2, dir: "N" },
      { face: "B", r: 2, c: 0, dir: "E" },
      { face: "B", r: 2, c: 3, dir: "W" },
    ] as const;

    for (const entry of cases) {
      const pawn = getPiece(board, entry);
      expect(pawn?.kind).toBe("P");
      expect(pawn?.forwardDir).toBe(entry.dir);
    }
  });
});
