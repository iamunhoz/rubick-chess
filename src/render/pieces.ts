import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

import type { Color, PieceKind } from "../rules/types";

type PieceMap = Record<PieceKind, THREE.Mesh>;
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

function meshHeight(mesh: THREE.Mesh): number {
  const box = new THREE.Box3().setFromObject(mesh);
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

export function assignPieceKinds(candidates: THREE.Mesh[]): PieceMap {
  const byKind = new Map<PieceKind, THREE.Mesh>();
  const leftovers: THREE.Mesh[] = [];

  for (const mesh of candidates) {
    const kind = nameToKind(mesh.name);
    if (kind && !byKind.has(kind)) {
      byKind.set(kind, mesh);
      continue;
    }
    leftovers.push(mesh);
  }

  const unresolvedKinds = KIND_ORDER.filter((kind) => !byKind.has(kind));
  leftovers.sort((a, b) => meshHeight(a) - meshHeight(b));

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

export function createBlackMaterialVariant(material: THREE.Material): THREE.Material {
  const variant = material.clone();

  if ("color" in variant && variant.color instanceof THREE.Color) {
    const hsl = { h: 0, s: 0, l: 0 };
    variant.color.getHSL(hsl);
    variant.color.setHSL(hsl.h, Math.min(1, hsl.s * 0.75), Math.max(0.08, hsl.l * 0.35));
  }

  if ("emissive" in variant && variant.emissive instanceof THREE.Color) {
    variant.emissive.setHex(0x000000);
  }

  return variant;
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

  clone.applyMatrix4(mesh.matrixWorld);
  return clone;
}

function normalizePrototypeMesh(mesh: THREE.Mesh, kind: PieceKind, color: Color): THREE.Group {
  const root = new THREE.Group();
  const worldMesh = cloneMeshWithWorldTransform(mesh);
  root.add(worldMesh);

  if (color === "B") {
    traverseMeshes(root, (child) => {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m: THREE.Material) => createBlackMaterialVariant(m));
      } else {
        child.material = createBlackMaterialVariant(child.material as THREE.Material);
      }
    });
  }

  const bbox = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bbox.getSize(size);
  bbox.getCenter(center);

  root.position.sub(center);
  root.position.y += size.y / 2;

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
  const meshes: THREE.Mesh[] = [];
  gltf.scene.updateWorldMatrix(true, true);
  traverseMeshes(gltf.scene, (mesh) => {
    meshes.push(mesh);
  });

  const mapped = assignPieceKinds(meshes);

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
  createBlackMaterialVariant,
};
