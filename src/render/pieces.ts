import * as THREE from "three";

import type { Color, PieceKind } from "../rules/types";

type ModelKey = `${Color}:${PieceKind}`;

const cache = new Map<ModelKey, any>();

const voxel = 0.16;

function palette(color: Color): { base: number; body: number } {
  if (color === "W") return { base: 0xb9c4d8, body: 0xe7eefc };
  return { base: 0x0b0f17, body: 0x1f2432 };
}

function box(w: number, h: number, d: number, mat: any): any {
  const geom = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geom, mat);
}

function layer(
  group: any,
  y: number,
  cells: Array<[number, number]>,
  mat: any,
  size = voxel,
): void {
  for (const [cx, cz] of cells) {
    const m = box(size, voxel, size, mat);
    m.position.set(cx * size, y, cz * size);
    group.add(m);
  }
}

function core(
  group: any,
  y0: number,
  height: number,
  radius: number,
  mat: any,
): void {
  for (let i = 0; i < height; i++) {
    const y = y0 + i * voxel;
    const r = Math.max(1, radius - Math.floor(i / 2));
    const cells: Array<[number, number]> = [];
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        if (Math.abs(x) + Math.abs(z) <= r + 1) cells.push([x, z]);
      }
    }
    layer(group, y, cells, mat);
  }
}

function buildPawn(baseMat: any, bodyMat: any): any {
  const g = new THREE.Group();
  core(g, 0, 2, 2, baseMat);
  core(g, 2 * voxel, 3, 1, bodyMat);
  layer(g, 5 * voxel, [[0, 0]], bodyMat);
  return g;
}

function buildRook(baseMat: any, bodyMat: any): any {
  const g = new THREE.Group();
  core(g, 0, 2, 2, baseMat);
  core(g, 2 * voxel, 4, 2, bodyMat);
  // Crenellations
  layer(
    g,
    6 * voxel,
    [
      [-2, -2],
      [-2, 2],
      [2, -2],
      [2, 2],
    ],
    bodyMat,
    voxel,
  );
  return g;
}

function buildBishop(baseMat: any, bodyMat: any): any {
  const g = new THREE.Group();
  core(g, 0, 2, 2, baseMat);
  core(g, 2 * voxel, 4, 1, bodyMat);
  layer(g, 6 * voxel, [[0, 0]], bodyMat);
  layer(g, 7 * voxel, [[0, 0]], bodyMat);
  return g;
}

function buildKnight(baseMat: any, bodyMat: any): any {
  const g = new THREE.Group();
  core(g, 0, 2, 2, baseMat);
  core(g, 2 * voxel, 3, 2, bodyMat);
  // Head / snout offset forward (+Z)
  layer(g, 5 * voxel, [[0, 1]], bodyMat);
  layer(g, 6 * voxel, [[0, 1]], bodyMat);
  layer(g, 6 * voxel, [[0, 2]], bodyMat);
  return g;
}

function buildQueen(baseMat: any, bodyMat: any): any {
  const g = new THREE.Group();
  core(g, 0, 2, 2, baseMat);
  core(g, 2 * voxel, 5, 2, bodyMat);
  // Crown hints
  layer(
    g,
    7 * voxel,
    [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ],
    bodyMat,
  );
  layer(g, 8 * voxel, [[0, 0]], bodyMat);
  return g;
}

function buildKing(baseMat: any, bodyMat: any): any {
  const g = new THREE.Group();
  core(g, 0, 2, 2, baseMat);
  core(g, 2 * voxel, 5, 2, bodyMat);
  // Cross
  layer(
    g,
    7 * voxel,
    [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ],
    bodyMat,
  );
  layer(g, 8 * voxel, [[0, 0]], bodyMat);
  return g;
}

function build(kind: PieceKind, color: Color): any {
  const { base, body } = palette(color);
  const baseMat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.95, metalness: 0 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: body, roughness: 0.85, metalness: 0 });

  const g =
    kind === "P"
      ? buildPawn(baseMat, bodyMat)
      : kind === "R"
        ? buildRook(baseMat, bodyMat)
        : kind === "B"
          ? buildBishop(baseMat, bodyMat)
          : kind === "N"
            ? buildKnight(baseMat, bodyMat)
            : kind === "Q"
              ? buildQueen(baseMat, bodyMat)
              : buildKing(baseMat, bodyMat);

  // Center on origin and lift so bottom touches y=0
  const bbox = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  g.position.sub(center);
  g.position.y += size.y / 2;

  // Scale to fit inside a tile footprint
  const footprint = Math.max(size.x, size.z);
  const maxFootprint = 0.72; // tile is ~1, keep margin
  const s = footprint > 0 ? maxFootprint / footprint : 1;
  g.scale.setScalar(s);

  return g;
}

export function getPieceModel(kind: PieceKind, color: Color): any {
  const key: ModelKey = `${color}:${kind}`;
  const proto = cache.get(key) ?? (() => {
    const created = build(kind, color);
    cache.set(key, created);
    return created;
  })();

  return proto.clone(true);
}

export function createPieceOutline(model: any, color = 0x2f8cff): any {
  const outline = model.clone(true);
  outline.scale.multiplyScalar(1.06);

  outline.traverse((obj: any) => {
    if (!obj?.isMesh) return;
    obj.material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.0,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    obj.renderOrder = 2;
  });

  outline.visible = false;
  return outline;
}
