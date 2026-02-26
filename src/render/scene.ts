import * as THREE from "three";

import type { Board } from "../rules/board";
import { getPiece } from "../rules/board";
import type { Face, Pos } from "../rules/types";

type SceneApi = {
  sync: () => void;
  setSelected: (pos: Pos | null) => void;
  setHighlights: (positions: Pos[]) => void;
};

const faces: Face[] = ["U", "D", "F", "B", "L", "R"];
const TILE_SIZE = 1;
const HALF = 2;

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

export function createScene(
  container: HTMLElement,
  getBoard: () => Board,
  opts?: { onTileClick?: (pos: Pos) => void },
): SceneApi {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.max(1, window.devicePixelRatio || 1));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f17);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(7, 6, 7);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5, 8, 6);
  scene.add(dir);

  const root = new THREE.Group();
  scene.add(root);

  const tiles = new Map<string, any>();
  const tileGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95);
  const baseA = 0x2c3242;
  const baseB = 0x1f2432;
  const highlightColor = 0x2f8cff;
  const moveColor = 0x2fe58c;

  for (const pos of allPositions()) {
    const { position, normal } = posToWorld(pos);
    const base = (pos.r + pos.c) % 2 === 0 ? baseA : baseB;
    const mat = new THREE.MeshStandardMaterial({
      color: base,
      emissive: 0x000000,
      emissiveIntensity: 0.9,
      roughness: 0.95,
      metalness: 0.0,
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
  const spriteMat = new THREE.SpriteMaterial({ color: 0xffffff });

  let selectedKey: string | null = null;
  const highlighted = new Set<string>();

  function setSelected(pos: Pos | null): void {
    selectedKey = pos ? posKey(pos) : null;
    refreshTileColors();
  }

  function setHighlights(positions: Pos[]): void {
    highlighted.clear();
    for (const p of positions) highlighted.add(posKey(p));
    refreshTileColors();
  }

  function refreshTileColors(): void {
    for (const [key, mesh] of tiles.entries()) {
      const mat = mesh.material as any;
      const base = mesh.userData.baseColor as number;
      mat.color.setHex(base);
      mat.emissive.setHex(0x000000);
      if (highlighted.has(key)) mat.emissive.setHex(moveColor);
      if (selectedKey === key) mat.emissive.setHex(highlightColor);
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
      let sprite = pieceMeshes.get(key);
      if (!sprite) {
        sprite = new THREE.Sprite(spriteMat.clone());
        const color = piece.color === "W" ? 0xe7eefc : 0x0b0f17;
        (sprite.material as any).color = new THREE.Color(color);
        sprite.scale.set(0.65, 0.65, 1);
        piecesGroup.add(sprite);
        pieceMeshes.set(key, sprite);
      }

      const [face, r, c] = key.split(":");
      const pos: Pos = { face: face as Face, r: Number(r) as Pos["r"], c: Number(c) as Pos["c"] };
      const { position, normal } = posToWorld(pos);
      sprite.position.copy(position.clone().add(normal.clone().multiplyScalar(0.45)));
      sprite.userData = { label: pieceLabel(piece.kind, piece.color) };
    }

    for (const [key, sprite] of pieceMeshes.entries()) {
      if (present.has(key)) continue;
      piecesGroup.remove(sprite);
      pieceMeshes.delete(key);
    }
  }

  function animate(): void {
    resizeIfNeeded();
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
  renderer.domElement.addEventListener("pointerdown", (ev: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...tiles.values()], false);
    if (hits.length === 0) return;
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

  animate();

  refreshTileColors();
  return { sync, setSelected, setHighlights };
}
