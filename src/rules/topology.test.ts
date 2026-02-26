import { describe, expect, it } from "vitest";

import { step } from "./topology";
import type { Dir, Face, Pos } from "./types";

const faces: Face[] = ["U", "D", "F", "B", "L", "R"];
const dirs: Dir[] = ["N", "E", "S", "W"];

function opposite(dir: Dir): Dir {
  switch (dir) {
    case "N":
      return "S";
    case "S":
      return "N";
    case "E":
      return "W";
    case "W":
      return "E";
  }
}

describe("topology.step", () => {
  it("steps within a face", () => {
    const res = step({ face: "F", r: 2, c: 2 }, "N");
    expect(res).toEqual({ to: { face: "F", r: 1, c: 2 }, crossedFace: false });
  });

  it("crosses to another face at edges", () => {
    const res = step({ face: "F", r: 0, c: 1 }, "N");
    expect(res.crossedFace).toBe(true);
    expect(res.to.face).not.toBe("F");
  });

  it("always returns a valid position", () => {
    for (const face of faces) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const from: Pos = { face, r: r as Pos["r"], c: c as Pos["c"] };
          for (const dir of dirs) {
            const { to } = step(from, dir);
            expect(to.r).toBeGreaterThanOrEqual(0);
            expect(to.r).toBeLessThanOrEqual(3);
            expect(to.c).toBeGreaterThanOrEqual(0);
            expect(to.c).toBeLessThanOrEqual(3);
          }
        }
      }
    }
  });

  it("produces mutual adjacency (neighbor can step back via some direction)", () => {
    for (const face of faces) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const from: Pos = { face, r: r as Pos["r"], c: c as Pos["c"] };
          for (const dir of dirs) {
            const mid = step(from, dir).to;
            const canReturn = dirs.some((d) => {
              const back = step(mid, d).to;
              return back.face === from.face && back.r === from.r && back.c === from.c;
            });
            if (!canReturn) {
              throw new Error(`not mutual: from=${JSON.stringify(from)} dir=${dir} mid=${JSON.stringify(mid)}`);
            }
          }
        }
      }
    }
  });
});
