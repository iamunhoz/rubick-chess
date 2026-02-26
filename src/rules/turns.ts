import { getPiece, setPiece } from "./board";
import type { Board } from "./board";
import type { Face, Pos, RC } from "./types";

export type TurnDir = "CW" | "CCW";

type Vec3 = Readonly<{ x: number; y: number; z: number }>;

const TILE = 2 / 4;

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

function toRC(n: number): RC {
  return clampInt(n, 0, 3) as RC;
}

function quantizeIndex(value: number): number {
  const idx = Math.round((value + 0.75) / TILE);
  return clampInt(idx, 0, 3);
}

function posToPoint(pos: Pos): Vec3 {
  const { east, north, normal } = faceBasis[pos.face];
  const e = -0.75 + pos.c * TILE;
  const n = -0.75 + (3 - pos.r) * TILE;
  return add(add(scale(normal, 1), scale(east, e)), scale(north, n));
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

function pointToPos(face: Face, point: Vec3): Pos {
  const { east, north } = faceBasis[face];
  const e = dot(point, east);
  const n = dot(point, north);

  const c = toRC(quantizeIndex(e));
  const nIdx = quantizeIndex(n);
  const r = toRC(3 - nIdx);
  return { face, r, c };
}

function rotate90(point: Vec3, axis: Vec3, dir: TurnDir): Vec3 {
  // Define "CW" as clockwise when looking at the face from outside.
  // This corresponds to a -90° rotation around the face normal (right-hand rule).
  const angleSign = dir === "CW" ? -1 : 1;

  // axis is one of ±X/±Y/±Z
  if (Math.abs(axis.x) === 1) {
    const s = axis.x * angleSign;
    // +90 around +X: (y,z)->(z,-y); -90: (y,z)->(-z,y)
    return s === 1
      ? { x: point.x, y: point.z, z: -point.y }
      : { x: point.x, y: -point.z, z: point.y };
  }

  if (Math.abs(axis.y) === 1) {
    const s = axis.y * angleSign;
    // +90 around +Y: (x,z)->(-z,x); -90: (x,z)->(z,-x)
    return s === 1
      ? { x: -point.z, y: point.y, z: point.x }
      : { x: point.z, y: point.y, z: -point.x };
  }

  {
    const s = axis.z * angleSign;
    // +90 around +Z: (x,y)->(-y,x); -90: (x,y)->(y,-x)
    return s === 1
      ? { x: -point.y, y: point.x, z: point.z }
      : { x: point.y, y: -point.x, z: point.z };
  }
}

function allPositions(): Pos[] {
  const faces: Face[] = ["U", "D", "F", "B", "L", "R"];
  const res: Pos[] = [];
  for (const face of faces) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) res.push({ face, r: r as Pos["r"], c: c as Pos["c"] });
    }
  }
  return res;
}

export function turnFace(board: Board, face: Face, dir: TurnDir): Board {
  const axis = faceBasis[face].normal;
  const affected: Pos[] = [];
  for (const pos of allPositions()) {
    const p = posToPoint(pos);
    const layerCoord = dot(p, axis);
    if (layerCoord > 0.9) affected.push(pos);
  }

  const moves = new Map<string, Pos>();
  for (const from of affected) {
    const p = posToPoint(from);
    const rotated = rotate90(p, axis, dir);
    const projected = projectToSurface(rotated);
    const toFace = faceFromPoint(projected);
    const to = pointToPos(toFace, projected);
    moves.set(`${from.face}:${from.r}:${from.c}`, to);
  }

  let next = board;
  for (const from of affected) {
    const piece = getPiece(board, from);
    if (piece === null) continue;
    const to = moves.get(`${from.face}:${from.r}:${from.c}`);
    if (!to) continue;
    next = setPiece(next, from, null);
    next = setPiece(next, to, piece);
  }
  return next;
}
