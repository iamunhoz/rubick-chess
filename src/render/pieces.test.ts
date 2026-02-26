import { describe, expect, it } from "vitest";

import { heightScaleFor } from "./pieces";

describe("heightScaleFor", () => {
  it("returns the expected Queen-based scale table", () => {
    expect(heightScaleFor("Q")).toBeCloseTo(1.0, 5);
    expect(heightScaleFor("K")).toBeCloseTo(0.97, 5);
    expect(heightScaleFor("R")).toBeCloseTo(0.88, 5);
    expect(heightScaleFor("B")).toBeCloseTo(0.88, 5);
    expect(heightScaleFor("N")).toBeCloseTo(0.8, 5);
    expect(heightScaleFor("P")).toBeCloseTo(0.7, 5);
  });
});
