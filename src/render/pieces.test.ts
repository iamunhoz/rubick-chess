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

/** Create a mesh inside a parent group, both with non-identity transforms. */
function meshInHierarchy(
  meshPos: THREE.Vector3,
  parentPos?: THREE.Vector3,
  parentRotationY?: number,
): { parent: THREE.Group; mesh: THREE.Mesh } {
  const parent = new THREE.Group();
  if (parentPos) parent.position.copy(parentPos);
  if (parentRotationY !== undefined) parent.rotation.y = parentRotationY;

  const geometry = new THREE.BoxGeometry(1, 2, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(meshPos);

  parent.add(mesh);
  parent.updateMatrixWorld(true);
  return { parent, mesh };
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
  it("returns a new material with fixed dark charcoal color regardless of input", () => {
    const original = new THREE.MeshStandardMaterial({ color: 0xfafcff });
    const black = __pieceInternals.createBlackMaterialVariant(original);

    const blackStd = black as THREE.MeshStandardMaterial;
    expect(blackStd).not.toBe(original);
    expect(blackStd.color.getHex()).toBe(0x2a2a2e);
    expect(blackStd.roughness).toBe(0.55);
    expect(blackStd.metalness).toBe(0.05);
    expect(blackStd.transparent).toBe(false);
    expect(blackStd.opacity).toBe(1.0);
    expect(blackStd.depthWrite).toBe(true);
  });
});

describe("createWhiteMaterialVariant", () => {
  it("returns a new material with fixed warm ivory color regardless of input", () => {
    const original = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const white = __pieceInternals.createWhiteMaterialVariant(original);

    const whiteStd = white as THREE.MeshStandardMaterial;
    expect(whiteStd).not.toBe(original);
    expect(whiteStd.color.getHex()).toBe(0xfff8e7);
    expect(whiteStd.roughness).toBe(0.45);
    expect(whiteStd.metalness).toBe(0.02);
    expect(whiteStd.transparent).toBe(false);
    expect(whiteStd.opacity).toBe(1.0);
    expect(whiteStd.depthWrite).toBe(true);
  });
});

describe("piece positioning", () => {
  it("normalized prototype is centered at origin", () => {
    const { mesh } = meshInHierarchy(
      new THREE.Vector3(5, 3, 2),
      new THREE.Vector3(1, 0.5, -1),
    );

    const result = __pieceInternals.normalizePrototypeMesh(mesh, "P", "W");
    const bbox = new THREE.Box3().setFromObject(result);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    expect(center.x).toBeCloseTo(0, 1);
    expect(center.z).toBeCloseTo(0, 1);
    expect(bbox.min.y).toBeCloseTo(0, 1);
  });

  it("piece position survives syncPieces-style placement", () => {
    const { mesh } = meshInHierarchy(
      new THREE.Vector3(5, 3, 2),
      new THREE.Vector3(1, 0.5, -1),
    );

    const normalized = __pieceInternals.normalizePrototypeMesh(mesh, "P", "W");

    const placed = normalized.clone();
    placed.position.set(2, 0, 2);
    placed.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    );
    placed.updateMatrixWorld(true);

    const bbox = new THREE.Box3().setFromObject(placed);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Piece center should be near where we placed it, NOT offset by the
    // original GLB world position (which was 5+ units away). When the piece
    // is rotated 90 degrees its height axis maps into Z, so the bbox center
    // may shift by up to half the scaled piece height — hence the tolerance.
    expect(Math.abs(center.x - 2)).toBeLessThan(1);
    expect(Math.abs(center.z - 2)).toBeLessThan(1);
  });

  it("centering works with rotated parent hierarchy", () => {
    const { mesh } = meshInHierarchy(
      new THREE.Vector3(3, 1, 4),
      new THREE.Vector3(0, 0, 0),
      Math.PI / 4,
    );

    const result = __pieceInternals.normalizePrototypeMesh(mesh, "R", "W");
    const bbox = new THREE.Box3().setFromObject(result);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    expect(center.x).toBeCloseTo(0, 1);
    expect(center.z).toBeCloseTo(0, 1);
    expect(bbox.min.y).toBeCloseTo(0, 1);
  });
});
