import * as THREE from "three";

import type { Board } from "../rules/board";
import { getPiece } from "../rules/board";
import type { Face, Pos } from "../rules/types";
import { createCameraRig, type SnapPreset } from "./camera";
import {
  createPieceOutline,
  createPieceSilhouette,
  getPieceModel,
  preloadPieceModels,
} from "./pieces";

type SceneApi = {
  sync: () => void;
  setSelected: (pos: Pos | null) => void;
  setHighlights: (positions: Pos[]) => void;
  setMoveTarget: (pos: Pos | null) => void;
  snapTo: (preset: SnapPreset) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  projectToScreen: (world: any) => { x: number; y: number; z: number };
  getPieceAnchorWorld: (pos: Pos) => any;
  animateTurn: (face: Face, dir: "CW" | "CCW", durationMs: number, onDone: () => void) => void;
};

const faces: Face[] = ["U", "D", "F", "B", "L", "R"];
const TILE_SIZE = 1;
const HALF = 2;

type SkyAnimator = { texture: InstanceType<typeof THREE.CanvasTexture>; update: (deltaSec: number) => void };

function createSkyAnimator(): SkyAnimator | null {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const ctxSafe = ctx;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  let offset = 0;

  function draw(): void {
    const grad = ctxSafe.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#e2f1ff");
    grad.addColorStop(0.6, "#b7dcff");
    grad.addColorStop(1, "#8ec4ff");
    ctxSafe.fillStyle = grad;
    ctxSafe.fillRect(0, 0, canvas.width, canvas.height);

    const cloudWidth = 180;
    const cloudHeight = 70;
    const cloudCount = 6;
    ctxSafe.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < cloudCount; i++) {
      const baseX = ((i / cloudCount) * canvas.width + offset) % (canvas.width + cloudWidth) - cloudWidth;
      const baseY = canvas.height * (0.2 + 0.15 * Math.sin(i * 1.3));
      drawCloud(ctxSafe, baseX, baseY, cloudWidth, cloudHeight);
    }

    texture.needsUpdate = true;
  }

  function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    context.beginPath();
    context.ellipse(x, y, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
    context.ellipse(x + w * 0.3, y - h * 0.2, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
    context.ellipse(x + w * 0.65, y - h * 0.05, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
    context.ellipse(x + w * 0.4, y + h * 0.1, w * 0.5, h * 0.28, 0, 0, Math.PI * 2);
    context.fill();
  }

  function update(deltaSec: number): void {
    offset = (offset + deltaSec * 60) % (canvas.width + 180);
    draw();
  }

  draw();
  return { texture, update };
}

function posKey(pos: Pos): string {
  return `${pos.face}:${pos.r}:${pos.c}`;
}

function posToWorld(pos: Pos): { position: any; normal: any } {
  const c = -1.5 + pos.c;
  const r = -1.5 + (3 - pos.r);

  switch (pos.face) {
    case "F":
      return { position: new THREE.Vector3(c, r, HALF), normal: new THREE.Vector3(0, 0, 1) };
    case "B":
      return { position: new THREE.Vector3(-c, r, -HALF), normal: new THREE.Vector3(0, 0, -1) };
    case "U":
      return { position: new THREE.Vector3(c, HALF, -r), normal: new THREE.Vector3(0, 1, 0) };
    case "D":
      return { position: new THREE.Vector3(c, -HALF, r), normal: new THREE.Vector3(0, -1, 0) };
    case "R":
      return { position: new THREE.Vector3(HALF, r, -c), normal: new THREE.Vector3(1, 0, 0) };
    case "L":
      return { position: new THREE.Vector3(-HALF, r, c), normal: new THREE.Vector3(-1, 0, 0) };
  }
}

function allPositions(): Pos[] {
  const res: Pos[] = [];
  for (const face of faces) {
    for (let rr = 0; rr < 4; rr++) {
      for (let cc = 0; cc < 4; cc++) res.push({ face, r: rr as Pos["r"], c: cc as Pos["c"] });
    }
  }
  return res;
}

function pieceLabel(kind: string, color: string): string {
  return `${color}${kind}`;
}

export async function createScene(
  container: HTMLElement,
  getBoard: () => Board,
  opts?: { onTileClick?: (pos: Pos) => void; onEmptyClick?: () => void },
): Promise<SceneApi> {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.max(1, window.devicePixelRatio || 1));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const sky = createSkyAnimator();
  if (sky) {
    scene.background = sky.texture;
  } else {
    scene.background = new THREE.Color(0xaed6ff);
  }

  const rig = createCameraRig(renderer.domElement, { w: container.clientWidth, h: container.clientHeight });
  const camera = rig.camera;

  function getPieceAnchorWorld(pos: Pos): any {
    const { position, normal } = posToWorld(pos);
    return position.clone().add(normal.clone().multiplyScalar(0.75));
  }

  function projectToScreen(world: any): { x: number; y: number; z: number } {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const v = world.clone().project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
      z: v.z,
    };
  }

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5, 8, 6);
  scene.add(dir);

  const root = new THREE.Group();
  scene.add(root);

  const occluderSize = TILE_SIZE * 4 - 0.2;
  const occluder = new THREE.Mesh(
    new THREE.BoxGeometry(occluderSize, occluderSize, occluderSize),
    new THREE.MeshStandardMaterial({
      color: 0x4a2518, // dark wood core (deeper than walnut tiles)
      roughness: 1,
      metalness: 0,
      transparent: false,
    }),
  );
  occluder.receiveShadow = false;
  occluder.castShadow = false;
  root.add(occluder);

  const tiles = new Map<string, any>();
  const tileGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95);
  const baseA = 0xd2a668; // warm light maple
  const baseB = 0x6b3a2a; // dark walnut
  const highlightColor = 0x2f8cff;
  const moveColor = 0x2fe58c;

  for (const pos of allPositions()) {
    const { position, normal } = posToWorld(pos);
    const base = (pos.r + pos.c) % 2 === 0 ? baseA : baseB;
    const isLight = base === baseA;
    const mat = new THREE.MeshStandardMaterial({
      color: base,
      emissive: isLight ? 0x3a2510 : 0x000000, // subtle warm glow on light tiles
      emissiveIntensity: isLight ? 0.12 : 0.0,
      roughness: 0.88, // polished wood surface
      metalness: 0.03, // faint wood grain sheen
    });
    const mesh = new THREE.Mesh(tileGeom, mat);
    mesh.position.copy(position);
    mesh.lookAt(position.clone().add(normal));
    root.add(mesh);
    mesh.userData = { baseColor: base };
    tiles.set(posKey(pos), mesh);
  }

  const piecesGroup = new THREE.Group();
  root.add(piecesGroup);

  const pieceMeshes = new Map<string, any>();
  const silhouetteMeshes = new Map<string, any>();
  const outlineMeshes = new Map<string, any>();

  function quatFromUpToNormal(normal: any): any {
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(up, normal.clone().normalize());
    return q;
  }

  let selectedKey: string | null = null;
  let moveTargetKey: string | null = null;
  const highlighted = new Set<string>();
  const moveTargetColor = 0xffa62f; // orange for keyboard-targeted move

  function setSelected(pos: Pos | null): void {
    selectedKey = pos ? posKey(pos) : null;
    refreshTileColors();
  }

  function setHighlights(positions: Pos[]): void {
    highlighted.clear();
    for (const p of positions) highlighted.add(posKey(p));
    refreshTileColors();
  }

  function setMoveTarget(pos: Pos | null): void {
    moveTargetKey = pos ? posKey(pos) : null;
    refreshTileColors();
  }

  function refreshTileColors(): void {
    for (const [key, mesh] of tiles.entries()) {
      const mat = mesh.material as any;
      const base = mesh.userData.baseColor as number;
      const isLight = base === baseA;
      mat.color.setHex(base);
      // Restore warm emissive glow on light wood tiles by default
      mat.emissive.setHex(isLight ? 0x3a2510 : 0x000000);
      mat.emissiveIntensity = isLight ? 0.12 : 0.0;
      if (highlighted.has(key)) { mat.emissive.setHex(moveColor); mat.emissiveIntensity = 0.45; }
      if (moveTargetKey === key) { mat.emissive.setHex(moveTargetColor); mat.emissiveIntensity = 0.7; }
      if (selectedKey === key) { mat.emissive.setHex(highlightColor); mat.emissiveIntensity = 0.45; }
    }
  }

  function resizeIfNeeded(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const need = renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) ||
      renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio());
    if (!need) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function syncPieces(board: Board): void {
    const present = new Set<string>();
    for (const [key, piece] of board.pieces.entries()) {
      present.add(key);
      let model = pieceMeshes.get(key);
      if (!model) {
        model = getPieceModel(piece.kind, piece.color);
        model.userData = { pieceKey: key };
        model.traverse((obj: any) => {
          if (obj?.isMesh) obj.userData = { pieceKey: key };
        });

        const silhouette = createPieceSilhouette(model);
        silhouette.userData = { pieceKey: key };
        silhouetteMeshes.set(key, silhouette);
        piecesGroup.add(silhouette);

        const outline = createPieceOutline(model, 0x2f8cff);
        outline.userData = { pieceKey: key };
        outlineMeshes.set(key, outline);
        piecesGroup.add(outline);

        piecesGroup.add(model);
        pieceMeshes.set(key, model);
      }

      const [face, r, c] = key.split(":");
      const pos: Pos = { face: face as Face, r: Number(r) as Pos["r"], c: Number(c) as Pos["c"] };
      const { position, normal } = posToWorld(pos);
      model.position.copy(position.clone().add(normal.clone().multiplyScalar(0.08)));
      model.quaternion.copy(quatFromUpToNormal(normal));
      model.userData = { label: pieceLabel(piece.kind, piece.color) };

      const silhouette = silhouetteMeshes.get(key);
      if (silhouette) {
        silhouette.position.copy(model.position);
        silhouette.quaternion.copy(model.quaternion);
      }

      const outline = outlineMeshes.get(key);
      if (outline) {
        outline.position.copy(model.position);
        outline.quaternion.copy(model.quaternion);
      }
    }

    for (const [key, model] of pieceMeshes.entries()) {
      if (present.has(key)) continue;
      piecesGroup.remove(model);
      pieceMeshes.delete(key);
      const silhouette = silhouetteMeshes.get(key);
      if (silhouette) piecesGroup.remove(silhouette);
      silhouetteMeshes.delete(key);
      const outline = outlineMeshes.get(key);
      if (outline) piecesGroup.remove(outline);
      outlineMeshes.delete(key);
    }
  }

  let lastFrameTime: number | null = null;
  function animate(now?: number): void {
    if (typeof now === "number") {
      if (lastFrameTime === null) lastFrameTime = now;
      const delta = (now - lastFrameTime) / 1000;
      if (sky) sky.update(delta);
      lastFrameTime = now;
    }
    resizeIfNeeded();
    rig.controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function sync(): void {
    const board = getBoard();
    syncPieces(board);
  }

  // Basic click-to-log selection hook (wiring to rules comes later).
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener("contextmenu", (ev: MouseEvent) => {
    ev.preventDefault();
  });

  let isAnimating = false;

  let hoveredPieceKey: string | null = null;

  await preloadPieceModels();
  function setHoveredPiece(key: string | null): void {
    if (hoveredPieceKey === key) return;
    hoveredPieceKey = key;
    for (const [k, outline] of outlineMeshes.entries()) {
      outline.visible = k === hoveredPieceKey;
    }
  }

  function keyFromIntersectedObject(obj: any): string | null {
    let cur: any = obj;
    while (cur) {
      const key = cur?.userData?.pieceKey;
      if (typeof key === "string") return key;
      cur = cur.parent;
    }
    return null;
  }

  renderer.domElement.addEventListener("pointermove", (ev: PointerEvent) => {
    if (isAnimating) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);

    const pieceObjects = Array.from(pieceMeshes.values());
    const hits = raycaster.intersectObjects(pieceObjects, true);
    if (hits.length === 0) {
      setHoveredPiece(null);
      return;
    }
    const key = keyFromIntersectedObject(hits[0]?.object);
    setHoveredPiece(key);
  });

  renderer.domElement.addEventListener("pointerdown", (ev: PointerEvent) => {
    if (isAnimating) return;
    if (ev.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);

    // Prefer selecting a piece directly.
    const pieceRoots = [...pieceMeshes.values(), ...outlineMeshes.values()];
    const pieceHits = raycaster.intersectObjects(pieceRoots, true);
    if (pieceHits.length > 0) {
      const key = keyFromIntersectedObject(pieceHits[0]?.object);
      if (key) {
        const [face, r, c] = key.split(":");
        const pos: Pos = { face: face as Face, r: Number(r) as Pos["r"], c: Number(c) as Pos["c"] };
        opts?.onTileClick?.(pos);
        return;
      }
    }

    const hits = raycaster.intersectObjects([...tiles.values()], false);
    if (hits.length === 0) {
      opts?.onEmptyClick?.();
      return;
    }
    const mesh = hits[0]?.object as any;
    const entry = [...tiles.entries()].find(([, m]) => m === mesh);
    if (!entry) return;
    const [key] = entry;
    const [face, r, c] = key.split(":");
    const pos: Pos = { face: face as Face, r: Number(r) as Pos["r"], c: Number(c) as Pos["c"] };
    opts?.onTileClick?.(pos);
    const piece = getPiece(getBoard(), pos);
    if (piece) console.log("tile", pos, piece);
  });

  function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function faceAxis(face: Face): any {
    switch (face) {
      case "F":
        return new THREE.Vector3(0, 0, 1);
      case "B":
        return new THREE.Vector3(0, 0, -1);
      case "U":
        return new THREE.Vector3(0, 1, 0);
      case "D":
        return new THREE.Vector3(0, -1, 0);
      case "R":
        return new THREE.Vector3(1, 0, 0);
      case "L":
        return new THREE.Vector3(-1, 0, 0);
    }
  }

  function animateTurn(face: Face, dir: "CW" | "CCW", durationMs: number, onDone: () => void): void {
    if (isAnimating) return;
    isAnimating = true;
    setHoveredPiece(null);

    const axis = faceAxis(face).normalize();
    const angle = dir === "CW" ? -Math.PI / 2 : Math.PI / 2;

    const pivot = new THREE.Group();
    root.add(pivot);

    // Optional: a faint overlay plane to emphasize the turning layer.
    const overlay = new THREE.Mesh(
      new THREE.PlaneGeometry(4.1, 4.1),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.06,
        emissive: 0xffffff,
        emissiveIntensity: 0.15,
        depthWrite: false,
      }),
    );
    overlay.position.copy(axis.clone().multiplyScalar(2.02));
    overlay.lookAt(overlay.position.clone().add(axis));
    pivot.add(overlay);

    const threshold = 1.5 - 1e-6;
    const affected: any[] = [];
    const parents = new Map<any, any>();

    for (const [key, model] of pieceMeshes.entries()) {
      const d = model.position.dot(axis);
      if (d < threshold) continue;
      const pack = [model, silhouetteMeshes.get(key), outlineMeshes.get(key)].filter(Boolean);
      for (const obj of pack) {
        if (parents.has(obj)) continue;
        parents.set(obj, obj.parent);
        affected.push(obj);
      }
    }

    for (const obj of affected) pivot.attach(obj);

    const start = performance.now();
    function tick(now: number): void {
      const t = Math.min(1, (now - start) / durationMs);
      const e = easeInOut(t);
      pivot.setRotationFromAxisAngle(axis, angle * e);
      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      }

      // Detach and cleanup.
      for (const obj of affected) {
        const p = parents.get(obj);
        if (p) p.attach(obj);
      }
      root.remove(pivot);

      isAnimating = false;
      onDone();
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(animate);

  refreshTileColors();
  return { sync, setSelected, setHighlights, setMoveTarget, snapTo: rig.snapTo, zoomIn: rig.zoomIn, zoomOut: rig.zoomOut, projectToScreen, getPieceAnchorWorld, animateTurn };
}
