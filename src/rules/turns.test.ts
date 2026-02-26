import { describe, expect, it } from "vitest";

import { createEmptyBoard, getPiece, setPiece } from "./board";
import { turnFace } from "./turns";
import type { Face, Pos } from "./types";

function findId(board: ReturnType<typeof createEmptyBoard>, id: string): Pos | null {
  const faces: Face[] = ["U", "D", "F", "B", "L", "R"];
  for (const face of faces) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const pos: Pos = { face, r: r as Pos["r"], c: c as Pos["c"] };
        if (getPiece(board, pos)?.id === id) return pos;
      }
    }
  }
  return null;
}

describe("turns.turnFace", () => {
  it("rotates squares on the face", () => {
    let board = createEmptyBoard();
    const face: Face = "F";
    const from: Pos = { face, r: 0, c: 1 };
    board = setPiece(board, from, { id: "p1", color: "W", kind: "P" });

    const rotated = turnFace(board, face, "CW");
    const expected: Pos = { face, r: 1, c: 3 };
    const actual = findId(rotated, "p1");
    expect(actual).toEqual(expected);
    expect(getPiece(rotated, from)).toBeNull();
  });

  it("CW then CCW is identity", () => {
    let board = createEmptyBoard();
    board = setPiece(board, { face: "F", r: 0, c: 0 }, { id: "a", color: "W", kind: "R" });
    board = setPiece(board, { face: "U", r: 3, c: 0 }, { id: "b", color: "B", kind: "N" });
    board = setPiece(board, { face: "R", r: 1, c: 0 }, { id: "c", color: "W", kind: "B" });

    const a = turnFace(board, "F", "CW");
    const b = turnFace(a, "F", "CCW");

    expect(getPiece(b, { face: "F", r: 0, c: 0 })?.id).toBe("a");
    expect(getPiece(b, { face: "U", r: 3, c: 0 })?.id).toBe("b");
    expect(getPiece(b, { face: "R", r: 1, c: 0 })?.id).toBe("c");
  });

  it("four CW turns is identity", () => {
    let board = createEmptyBoard();
    board = setPiece(board, { face: "F", r: 2, c: 3 }, { id: "a", color: "W", kind: "Q" });
    board = setPiece(board, { face: "U", r: 3, c: 3 }, { id: "b", color: "B", kind: "P" });
    board = setPiece(board, { face: "L", r: 0, c: 1 }, { id: "c", color: "W", kind: "N" });

    const t1 = turnFace(board, "F", "CW");
    const t2 = turnFace(t1, "F", "CW");
    const t3 = turnFace(t2, "F", "CW");
    const t4 = turnFace(t3, "F", "CW");

    expect(getPiece(t4, { face: "F", r: 2, c: 3 })?.id).toBe("a");
    expect(getPiece(t4, { face: "U", r: 3, c: 3 })?.id).toBe("b");
    expect(getPiece(t4, { face: "L", r: 0, c: 1 })?.id).toBe("c");
  });
});
