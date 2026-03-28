import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

import type { Color, PieceKind } from "../rules/types";

type PieceMap = Record<PieceKind, THREE.Object3D>;
type ModelKey = `${Color}:${PieceKind}`;

type MeshVisitor = (mesh: THREE.Mesh) => void;

const loader = new GLTFLoader();
const glbUrl = new URL("../../assets/Chess.glb", import.meta.url).href;

const modelCache = new Map<ModelKey, THREE.Object3D>();
let preloadPromise: Promise<void> | null = null;

const KIND_ORDER: readonly PieceKind[] = ["P", "N", "B", "R", "Q", "K"] as const;

const heightScaleByKind: Record<PieceKind, number> = {
  Q: 1.0,
  K: 0.97,
  R: 0.88,
  B: 0.88,
  N: 0.8,
  P: 0.7,
};

export function heightScaleFor(kind: PieceKind): number {
  return heightScaleByKind[kind] ?? 1.0;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function objectHeight(obj: THREE.Object3D): number {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  return size.y;
}

function nameToKind(name: string): PieceKind | null {
  const normalized = normalizeName(name);
  if (normalized.includes("pawn")) return "P";
  if (normalized.includes("rook") || normalized.includes("castle")) return "R";
  if (normalized.includes("bishop")) return "B";
  if (normalized.includes("king")) return "K";
  if (normalized.includes("queen")) return "Q";
  if (normalized.includes("knight") || normalized.includes("horse")) return "N";
  return null;
}

/**
 * Infer piece kind from an Object3D by checking its name and all descendant names.
 */
function objectToKind(obj: THREE.Object3D): PieceKind | null {
  const kind = nameToKind(obj.name);
  if (kind) return kind;
  // Check children/descendants for a recognisable name
  let found: PieceKind | null = null;
  obj.traverse((child) => {
    if (!found) {
      const k = nameToKind(child.name);
      if (k) found = k;
    }
  });
  return found;
}

/**
 * Collect top-level piece objects from the GLB scene.
 * Each direct child of the scene root that contains at least one mesh is
 * treated as a separate piece candidate. This correctly handles both
 * single-mesh pieces and multi-mesh pieces (Group -> child meshes).
 */
function collectPieceObjects(sceneRoot: THREE.Object3D): THREE.Object3D[] {
  const pieces: THREE.Object3D[] = [];
  for (const child of sceneRoot.children) {
    let hasMesh = false;
    child.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) hasMesh = true;
    });
    if (hasMesh) {
      pieces.push(child);
    }
  }
  return pieces;
}

export function assignPieceKinds(candidates: THREE.Object3D[]): PieceMap {
  const byKind = new Map<PieceKind, THREE.Object3D>();
  const leftovers: THREE.Object3D[] = [];

  for (const obj of candidates) {
    const kind = objectToKind(obj);
    if (kind && !byKind.has(kind)) {
      byKind.set(kind, obj);
      continue;
    }
    leftovers.push(obj);
  }

  const unresolvedKinds = KIND_ORDER.filter((kind) => !byKind.has(kind));
  leftovers.sort((a, b) => objectHeight(a) - objectHeight(b));

  for (let i = 0; i < unresolvedKinds.length && i < leftovers.length; i++) {
    byKind.set(unresolvedKinds[i], leftovers[i]);
  }

  for (const kind of KIND_ORDER) {
    if (!byKind.has(kind)) {
      throw new Error(`Unable to map GLB mesh to piece kind '${kind}'`);
    }
  }

  return {
    P: byKind.get("P")!,
    N: byKind.get("N")!,
    B: byKind.get("B")!,
    R: byKind.get("R")!,
    Q: byKind.get("Q")!,
    K: byKind.get("K")!,
  };
}

function cloneMaterial(material: THREE.Material): THREE.Material {
  return material.clone();
}

/**
 * Create a uniform warm ivory/porcelain material for white pieces.
 * Returns a brand-new MeshStandardMaterial with fixed properties,
 * ignoring the GLB's original material entirely. This guarantees
 * every sub-mesh renders identically regardless of what the GLB
 * shipped with.
 */
export function createWhiteMaterialVariant(_material: THREE.Material): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color: 0xfff8e7,        // warm ivory
    roughness: 0.45,         // porcelain sheen
    metalness: 0.02,
    emissive: 0x1a1408,      // subtle warm self-illumination
    emissiveIntensity: 0.15,
    vertexColors: false,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    side: THREE.FrontSide,
  });
}

/**
 * Create a uniform dark charcoal/graphite material for black pieces.
 * Returns a brand-new MeshStandardMaterial with fixed properties,
 * ignoring the GLB's original material entirely. Uses a visible
 * dark charcoal (0x2a2a2e) instead of near-black so pieces remain
 * distinguishable against dark walnut board tiles (0x6b3a2a).
 */
export function createBlackMaterialVariant(_material: THREE.Material): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,         // dark charcoal (NOT near-black)
    roughness: 0.55,          // slightly polished
    metalness: 0.05,
    emissive: 0x0a0a0c,      // very subtle self-illumination so shape reads
    emissiveIntensity: 0.12,
    vertexColors: false,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    side: THREE.FrontSide,
  });
}

function traverseMeshes(root: THREE.Object3D, visit: MeshVisitor): void {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      visit(child as THREE.Mesh);
    }
  });
}

function cloneMeshWithWorldTransform(mesh: THREE.Mesh): THREE.Mesh {
  mesh.updateWorldMatrix(true, false);

  const clone = mesh.clone();
  clone.geometry = mesh.geometry.clone();
  if (Array.isArray(mesh.material)) {
    clone.material = mesh.material.map((m: THREE.Material) => cloneMaterial(m));
  } else {
    clone.material = cloneMaterial(mesh.material as THREE.Material);
  }

  // Bake world transform into geometry vertices directly so that
  // downstream geometry-space operations (translate, bounding box)
  // work correctly regardless of any rotation in the GLB hierarchy.
  clone.geometry.applyMatrix4(mesh.matrixWorld);

  // Reset mesh transform to identity — the world transform now lives
  // entirely in the geometry vertices.
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  clone.scale.set(1, 1, 1);
  clone.updateMatrix();

  return clone;
}

function normalizePrototypeMesh(source: THREE.Object3D, kind: PieceKind, color: Color): THREE.Group {
  const root = new THREE.Group();

  // Collect ALL meshes from the source (handles both single Mesh and Group
  // with multiple child meshes). Clone each with its baked world transform
  // so they assemble correctly relative to each other.
  const sourceMeshes: THREE.Mesh[] = [];
  source.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      sourceMeshes.push(child as THREE.Mesh);
    }
  });

  const clonedMeshes: THREE.Mesh[] = [];
  for (const mesh of sourceMeshes) {
    const worldMesh = cloneMeshWithWorldTransform(mesh);
    root.add(worldMesh);
    clonedMeshes.push(worldMesh);
  }

  // Apply color-specific material variants.
  // White pieces need explicit treatment to ensure GLB-inherited transparency
  // is stripped and materials look solid (warm ivory / porcelain).
  // Black pieces get their own darkened variant.
  const materialTransform =
    color === "W" ? createWhiteMaterialVariant : createBlackMaterialVariant;

  traverseMeshes(root, (child) => {
    if (Array.isArray(child.material)) {
      child.material = child.material.map((m: THREE.Material) => materialTransform(m));
    } else {
      child.material = materialTransform(child.material as THREE.Material);
    }
  });

  // Strip vertex colors and texture maps from geometry so our uniform
  // materials aren't multiplied/overridden by GLB-baked data.
  traverseMeshes(root, (child) => {
    if (child.geometry.hasAttribute('color')) {
      child.geometry.deleteAttribute('color');
    }
    // Also ensure the material doesn't have any inherited texture maps
    const mat = child.material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map = null;
    if (mat.normalMap) mat.normalMap = null;
    if (mat.roughnessMap) mat.roughnessMap = null;
    if (mat.metalnessMap) mat.metalnessMap = null;
    if (mat.aoMap) mat.aoMap = null;
    if (mat.emissiveMap) mat.emissiveMap = null;
    if (mat.alphaMap) mat.alphaMap = null;
    mat.needsUpdate = true;
  });

  const bbox = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bbox.getSize(size);
  bbox.getCenter(center);

  // Translate ALL cloned meshes so the piece is centered at origin with
  // its base at y=0.
  const offset = new THREE.Vector3(-center.x, -center.y + size.y / 2, -center.z);
  for (const mesh of clonedMeshes) {
    mesh.geometry.translate(offset.x, offset.y, offset.z);
  }

  const footprint = Math.max(size.x, size.z);
  const maxFootprint = 0.72;
  const s = footprint > 0 ? maxFootprint / footprint : 1;
  root.scale.setScalar(s);
  root.scale.y *= heightScaleFor(kind);

  return root;
}

function cloneModelForUse(proto: THREE.Object3D): THREE.Object3D {
  const clone = cloneSkinned(proto) as THREE.Object3D;
  traverseMeshes(clone, (mesh) => {
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m: THREE.Material) => m.clone());
    } else {
      mesh.material = (mesh.material as THREE.Material).clone();
    }
  });
  return clone;
}

async function buildModelCache(): Promise<void> {
  const gltf = await loader.loadAsync(glbUrl);
  gltf.scene.updateWorldMatrix(true, true);

  // Collect top-level piece objects from the GLB scene. Each direct child
  // that contains meshes is treated as one piece candidate. This correctly
  // groups multi-mesh pieces (e.g. a knight composed of body + mane meshes)
  // so they are assigned as a single unit rather than split apart.
  const pieceObjects = collectPieceObjects(gltf.scene);

  const mapped = assignPieceKinds(pieceObjects);

  for (const kind of KIND_ORDER) {
    modelCache.set(`W:${kind}`, normalizePrototypeMesh(mapped[kind], kind, "W"));
    modelCache.set(`B:${kind}`, normalizePrototypeMesh(mapped[kind], kind, "B"));
  }
}

export function preloadPieceModels(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = buildModelCache();
  }
  return preloadPromise;
}

export function getPieceModel(kind: PieceKind, color: Color): THREE.Object3D {
  const key: ModelKey = `${color}:${kind}`;
  const proto = modelCache.get(key);
  if (!proto) {
    throw new Error("Piece models not preloaded. Call preloadPieceModels() before getPieceModel().");
  }
  return cloneModelForUse(proto);
}

export function createPieceOutline(model: THREE.Object3D, color = 0x2f8cff): THREE.Object3D {
  const outline = cloneModelForUse(model);
  outline.scale.multiplyScalar(1.06);

  traverseMeshes(outline, (mesh) => {
    mesh.material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.0,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    mesh.renderOrder = 2;
  });

  outline.visible = false;
  return outline;
}

export function createPieceSilhouette(model: THREE.Object3D): THREE.Object3D {
  const silhouette = cloneModelForUse(model);
  silhouette.scale.multiplyScalar(1.025);

  traverseMeshes(silhouette, (mesh) => {
    mesh.material = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.BackSide,
    });
    mesh.renderOrder = 1;
  });

  silhouette.visible = true;
  return silhouette;
}

export const __pieceInternals = {
  assignPieceKinds,
  createWhiteMaterialVariant,
  createBlackMaterialVariant,
  cloneMeshWithWorldTransform,
  normalizePrototypeMesh,
  collectPieceObjects,
  objectToKind,
};
