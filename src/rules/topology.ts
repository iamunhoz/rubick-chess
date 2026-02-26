import type { Dir, Face, Pos, RC } from "./types";

export type StepResult = {
  to: Pos;
  crossedFace: boolean;
};

type Vec3 = Readonly<{ x: number; y: number; z: number }>;

const TILE = 2 / 4; // 0.5

const faceBasis: Record<Face, { east: Vec3; north: Vec3; normal: Vec3 }> = {
  F: { east: { x: 1, y: 0, z: 0 }, north: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 0, z: 1 } },
  B: { east: { x: -1, y: 0, z: 0 }, north: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 0, z: -1 } },
  U: { east: { x: 1, y: 0, z: 0 }, north: { x: 0, y: 0, z: -1 }, normal: { x: 0, y: 1, z: 0 } },
  D: { east: { x: 1, y: 0, z: 0 }, north: { x: 0, y: 0, z: 1 }, normal: { x: 0, y: -1, z: 0 } },
  R: { east: { x: 0, y: 0, z: -1 }, north: { x: 0, y: 1, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
  L: { east: { x: 0, y: 0, z: 1 }, north: { x: 0, y: 1, z: 0 }, normal: { x: -1, y: 0, z: 0 } },
};

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function quantizeIndex(value: number): number {
  // Tile centers are: -0.75, -0.25, 0.25, 0.75 => -0.75 + i * 0.5
  const idx = Math.round((value + 0.75) / TILE);
  return clampInt(idx, 0, 3);
}

function toRC(n: number): RC {
  return clampInt(n, 0, 3) as RC;
}

function posToPoint(pos: Pos): Vec3 {
  const { east, north, normal } = faceBasis[pos.face];
  const e = -0.75 + pos.c * TILE;
  const n = -0.75 + (3 - pos.r) * TILE;
  return add(add(scale(normal, 1), scale(east, e)), scale(north, n));
}

function pointToPos(face: Face, point: Vec3): Pos {
  const { east, north } = faceBasis[face];
  const e = dot(point, east);
  const n = dot(point, north);

  const c = toRC(quantizeIndex(e));
  const nIdx = quantizeIndex(n);
  const r = toRC(3 - nIdx);
  return { face, r, c };
}

function faceFromPoint(point: Vec3): Face {
  const ax = Math.abs(point.x);
  const ay = Math.abs(point.y);
  const az = Math.abs(point.z);

  if (ax >= ay && ax >= az) return point.x >= 0 ? "R" : "L";
  if (ay >= ax && ay >= az) return point.y >= 0 ? "U" : "D";
  return point.z >= 0 ? "F" : "B";
}

function projectToSurface(point: Vec3): Vec3 {
  const m = Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
  return scale(point, 1 / m);
}

export function step(pos: Pos, dir: Dir): StepResult {
  // Fast path: within face.
  if (dir === "N" && pos.r > 0) return { to: { ...pos, r: toRC(pos.r - 1) }, crossedFace: false };
  if (dir === "S" && pos.r < 3) return { to: { ...pos, r: toRC(pos.r + 1) }, crossedFace: false };
  if (dir === "W" && pos.c > 0) return { to: { ...pos, c: toRC(pos.c - 1) }, crossedFace: false };
  if (dir === "E" && pos.c < 3) return { to: { ...pos, c: toRC(pos.c + 1) }, crossedFace: false };

  const basis = faceBasis[pos.face];
  const delta =
    dir === "N"
      ? basis.north
      : dir === "S"
        ? scale(basis.north, -1)
        : dir === "E"
          ? basis.east
          : scale(basis.east, -1);

  const p = posToPoint(pos);
  const p2 = add(p, scale(delta, TILE));
  const nextFace = faceFromPoint(p2);
  const projected = projectToSurface(p2);
  const to = pointToPos(nextFace, projected);
  return { to, crossedFace: to.face !== pos.face };
}
