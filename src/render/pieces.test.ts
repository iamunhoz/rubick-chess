import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { __pieceInternals } from "./pieces";

function meshNamed(name: string, height: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(1, height, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

describe("assignPieceKinds", () => {
  it("maps named meshes and infers queen/knight from remaining heights", () => {
    const candidates = [
      meshNamed("rook", 1.1),
      meshNamed("bishop", 1.2),
      meshNamed("pawn", 0.9),
      meshNamed("king", 1.5),
      meshNamed("Circle", 1.45),
      meshNamed("Circle001", 1.05),
    ];

    const resolved = __pieceInternals.assignPieceKinds(candidates);

    expect(resolved.P.name).toBe("pawn");
    expect(resolved.R.name).toBe("rook");
    expect(resolved.B.name).toBe("bishop");
    expect(resolved.K.name).toBe("king");
    expect(resolved.Q.name).toBe("Circle");
    expect(resolved.N.name).toBe("Circle001");
  });

  it("prefers explicit queen/knight names when present", () => {
    const candidates = [
      meshNamed("Rook", 1.1),
      meshNamed("Bishop", 1.2),
      meshNamed("Pawn", 0.9),
      meshNamed("King", 1.5),
      meshNamed("Queen", 1.45),
      meshNamed("Knight", 1.05),
    ];

    const resolved = __pieceInternals.assignPieceKinds(candidates);

    expect(resolved.Q.name).toBe("Queen");
    expect(resolved.N.name).toBe("Knight");
  });
});

describe("createBlackMaterialVariant", () => {
  it("clones and darkens mesh materials", () => {
    const original = new THREE.MeshStandardMaterial({ color: 0xfafcff });
    const black = __pieceInternals.createBlackMaterialVariant(original);

    expect(black).not.toBe(original);
    expect(black.color.getHex()).not.toBe(original.color.getHex());
    expect(black.color.getHSL({ h: 0, s: 0, l: 0 }).l)
      .toBeLessThan(original.color.getHSL({ h: 0, s: 0, l: 0 }).l);
  });
});
