import "./style.css";

import { createInitialGame } from "./rules/setup";
import { applyMove } from "./rules/apply";
import { getPiece } from "./rules/board";
import { legalMoves } from "./rules/moves";
import { applyAbility, isCorner } from "./rules/abilities";
import { step } from "./rules/topology";
import { createScene } from "./render/scene";
import { bindHud } from "./ui/hud";
import { bindKeyboard } from "./keyboard";
import type { Pos } from "./rules/types";
import type { Ability } from "./rules/abilities";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("#app not found");
const app: HTMLDivElement = appElement;

const versionMeta = document.createElement("meta");
versionMeta.name = "rubicks-chess-version";
versionMeta.content = typeof __BUILD_VERSION__ === "string" ? __BUILD_VERSION__ : "unknown";
document.head.appendChild(versionMeta);

app.innerHTML = `
  <div id="viewport"></div>
  <aside id="hud">
    <div class="hud-title">Rubicks Chess</div>
    <div class="hud-kv" id="hudSelection">Selection: none</div>
    <div class="hud-row">
      <button id="btnReset" type="button">Reset</button>
    </div>
    <div class="hud-title">Rotate</div>
    <div class="hud-row">
      <select id="selAbility">
        <option value="none">None</option>
        <option value="face">Face turn</option>
        <option value="layer-row">Layer turn (row)</option>
        <option value="layer-col">Layer turn (col)</option>
      </select>
      <select id="selDir">
        <option value="CW">CW</option>
        <option value="CCW">CCW</option>
      </select>
      <button id="btnApply" type="button">Apply</button>
    </div>
  </aside>
`;

app.dataset.hud = "hidden";

let game = createInitialGame();
let selection: Pos | null = null;
let selectionMoves: Pos[] = [];
let isAnimating = false;
let moveTargetIndex = -1; // -1 = no keyboard target

const viewport = document.querySelector<HTMLDivElement>("#viewport");
if (!viewport) throw new Error("#viewport not found");

const hudToggle = document.createElement("button");
hudToggle.id = "hudToggle";
hudToggle.type = "button";
viewport.appendChild(hudToggle);

let hudVisible = false;
function syncHudVisibility(): void {
  app.dataset.hud = hudVisible ? "visible" : "hidden";
  hudToggle.textContent = hudVisible ? "Hide Menu" : "Show Menu";
  hudToggle.setAttribute("aria-pressed", hudVisible ? "true" : "false");
}

hudToggle.addEventListener("click", () => {
  hudVisible = !hudVisible;
  syncHudVisibility();
});

syncHudVisibility();

const overlay = document.createElement("div");
overlay.id = "overlay";
overlay.style.position = "absolute";
overlay.style.left = "0";
overlay.style.top = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.pointerEvents = "none";
viewport.style.position = "relative";
viewport.appendChild(overlay);

const bubble = document.createElement("div");
bubble.id = "abilityBubble";
bubble.style.position = "absolute";
bubble.style.display = "none";
bubble.style.pointerEvents = "auto";
bubble.style.background = "rgba(15, 18, 26, 0.92)";
bubble.style.border = "1px solid rgba(255,255,255,0.12)";
bubble.style.borderRadius = "12px";
bubble.style.padding = "8px";
bubble.style.display = "none";
bubble.style.gap = "6px";
bubble.style.alignItems = "center";
bubble.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
bubble.style.backdropFilter = "blur(6px)";
bubble.style.pointerEvents = "auto";
bubble.style.userSelect = "none";
bubble.style.zIndex = "10";
bubble.style.display = "none";
bubble.style.flexWrap = "wrap";
bubble.style.maxWidth = "240px";
bubble.style.fontSize = "12px";
bubble.style.color = "rgba(231,238,252,0.95)";
bubble.style.display = "flex";
bubble.style.gap = "6px";
overlay.appendChild(bubble);

function iconArrow(cw: boolean): string {
  // Simple circular arrow
  const d = cw
    ? "M18 6a8 8 0 1 1-2.34-5.66L14 2h6v6l-1.74-1.74A6 6 0 1 0 18 6Z"
    : "M6 6a8 8 0 1 0 2.34-5.66L10 2H4v6l1.74-1.74A6 6 0 1 1 6 6Z";
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
}

function iconFace(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 7h10v10H7z" stroke="currentColor" stroke-width="2"/>
  </svg>`;
}

function iconRow(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function iconCol(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 4v16M16 4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function bubbleButton(label: string, svg: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.innerHTML = `${svg}<span>${label}</span>`;
  b.style.display = "inline-flex";
  b.style.alignItems = "center";
  b.style.gap = "6px";
  b.style.padding = "8px 10px";
  b.style.borderRadius = "10px";
  b.style.border = "1px solid rgba(255,255,255,0.12)";
  b.style.background = "rgba(255,255,255,0.04)";
  b.style.color = "inherit";
  b.style.cursor = "pointer";
  b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    onClick();
  });
  return b;
}

function rebuildBubble(): void {
  bubble.innerHTML = "";
  if (!selection) {
    bubble.style.display = "none";
    return;
  }

  const piece = getPiece(game.board, selection);
  if (!piece || !isCorner(selection)) {
    bubble.style.display = "none";
    return;
  }

  const isBQ = piece.kind === "B" || piece.kind === "Q";
  const isRQ = piece.kind === "R" || piece.kind === "Q";
  if (!isBQ && !isRQ) {
    bubble.style.display = "none";
    return;
  }

  function applyAndSync(nextBoard: typeof game.board): void {
    game = { board: nextBoard };
    selectionMoves = selection ? legalMoves(game.board, selection) : [];
    scene.setHighlights(selectionMoves);
    scene.sync();
    hud.sync();
  }

  function turnedFaceFor(ability: Ability): Pos["face"] {
    if (ability.kind === "FaceTurn") return ability.from.face;
    if (ability.axis === "row") {
      const dir = ability.from.r === 0 ? "N" : "S";
      return step(ability.from, dir).to.face;
    }
    const dir = ability.from.c === 0 ? "W" : "E";
    return step(ability.from, dir).to.face;
  }

  function applyAbilityAnimated(ability: Ability): void {
    if (isAnimating) return;
    isAnimating = true;
    bubble.style.pointerEvents = "none";
    bubble.style.opacity = "0.6";

    const face = turnedFaceFor(ability);
    const dir = ability.dir;
    scene.animateTurn(face, dir, 500, () => {
      const next = applyAbility(game.board, ability);
      applyAndSync(next);
      isAnimating = false;
      bubble.style.pointerEvents = "auto";
      bubble.style.opacity = "1";
    });
  }

  if (isBQ) {
    bubble.appendChild(
      bubbleButton("Face CW", iconFace() + iconArrow(true), () =>
        applyAbilityAnimated({ kind: "FaceTurn", from: selection!, dir: "CW" }),
      ),
    );
    bubble.appendChild(
      bubbleButton("Face CCW", iconFace() + iconArrow(false), () =>
        applyAbilityAnimated({ kind: "FaceTurn", from: selection!, dir: "CCW" }),
      ),
    );
  }

  if (isRQ) {
    bubble.appendChild(
      bubbleButton("Row CW", iconRow() + iconArrow(true), () =>
        applyAbilityAnimated({ kind: "LayerTurn", from: selection!, axis: "row", dir: "CW" }),
      ),
    );
    bubble.appendChild(
      bubbleButton("Row CCW", iconRow() + iconArrow(false), () =>
        applyAbilityAnimated({ kind: "LayerTurn", from: selection!, axis: "row", dir: "CCW" }),
      ),
    );
    bubble.appendChild(
      bubbleButton("Col CW", iconCol() + iconArrow(true), () =>
        applyAbilityAnimated({ kind: "LayerTurn", from: selection!, axis: "col", dir: "CW" }),
      ),
    );
    bubble.appendChild(
      bubbleButton("Col CCW", iconCol() + iconArrow(false), () =>
        applyAbilityAnimated({ kind: "LayerTurn", from: selection!, axis: "col", dir: "CCW" }),
      ),
    );
  }

  bubble.style.display = "flex";
}

function isSamePos(a: Pos, b: Pos): boolean {
  return a.face === b.face && a.r === b.r && a.c === b.c;
}

/** Get all board positions occupied by pieces, sorted by key for stable ordering. */
function allPiecePositions(): Pos[] {
  const positions: Pos[] = [];
  for (const key of [...game.board.pieces.keys()].sort()) {
    const [face, r, c] = key.split(":");
    positions.push({ face: face as Pos["face"], r: Number(r) as Pos["r"], c: Number(c) as Pos["c"] });
  }
  return positions;
}

function clearMoveTarget(): void {
  moveTargetIndex = -1;
}

function selectPiece(pos: Pos): void {
  selection = pos;
  selectionMoves = legalMoves(game.board, pos);
  clearMoveTarget();
  scene.setSelected(pos);
  scene.setHighlights(selectionMoves);
  scene.setMoveTarget(null);
  hud.sync();
  rebuildBubble();
}

function deselectAll(): void {
  selection = null;
  selectionMoves = [];
  clearMoveTarget();
  scene.setSelected(null);
  scene.setHighlights([]);
  scene.setMoveTarget(null);
  hud.sync();
  rebuildBubble();
}

function executeMove(from: Pos, to: Pos): void {
  game = { board: applyMove(game.board, from, to) };
  deselectAll();
  scene.sync();
}

const scene = await createScene(viewport, () => game.board, {
  onTileClick: (pos) => {
    if (isAnimating) return;
    const board = game.board;
    const clickedPiece = getPiece(board, pos);

    if (selection && selectionMoves.some((p) => isSamePos(p, pos))) {
      executeMove(selection, pos);
      return;
    }

    if (clickedPiece) {
      selectPiece(pos);
      return;
    }

    deselectAll();
  },
  onEmptyClick: () => {
    if (isAnimating) return;
    deselectAll();
  },
});

function updateBubblePosition(): void {
  if (!selection || bubble.style.display === "none") return;
  const world = scene.getPieceAnchorWorld(selection);
  const p = scene.projectToScreen(world);
  if (p.z < -1 || p.z > 1) {
    bubble.style.display = "none";
    return;
  }
  bubble.style.left = `${p.x}px`;
  bubble.style.top = `${p.y}px`;
  bubble.style.transform = "translate(-50%, -120%)";
}

function animateOverlay(): void {
  updateBubblePosition();
  requestAnimationFrame(animateOverlay);
}
animateOverlay();

const hud = bindHud({
  getBoard: () => game.board,
  setBoard: (b) => {
    game = { board: b };
    selectionMoves = selection ? legalMoves(game.board, selection) : [];
    scene.setHighlights(selectionMoves);
    scene.sync();
    hud.sync();
  },
  getSelection: () => selection,
  setSelection: (p) => {
    selection = p;
    selectionMoves = selection ? legalMoves(game.board, selection) : [];
    clearMoveTarget();
    scene.setSelected(selection);
    scene.setHighlights(selectionMoves);
    scene.setMoveTarget(null);
    rebuildBubble();
  },
  getSelectionMoves: () => selectionMoves,
  snapTo: (preset) => scene.snapTo(preset),
  applyAbilityAnimated: (ability) => {
    if (!selection) return;
    const face =
      ability.kind === "FaceTurn"
        ? ability.from.face
        : ability.axis === "row"
          ? step(ability.from, ability.from.r === 0 ? "N" : "S").to.face
          : step(ability.from, ability.from.c === 0 ? "W" : "E").to.face;

    if (isAnimating) return;
    isAnimating = true;
    scene.animateTurn(face, ability.dir, 500, () => {
      const next = applyAbility(game.board, ability);
      game = { board: next };
      selectionMoves = selection ? legalMoves(game.board, selection) : [];
      scene.setHighlights(selectionMoves);
      scene.sync();
      hud.sync();
      isAnimating = false;
    });
  },
});

// --- Build the ordered ability list for the currently selected piece ---
function currentAbilities(): Ability[] {
  if (!selection) return [];
  const piece = getPiece(game.board, selection);
  if (!piece || !isCorner(selection)) return [];
  const abilities: Ability[] = [];
  const isBQ = piece.kind === "B" || piece.kind === "Q";
  const isRQ = piece.kind === "R" || piece.kind === "Q";
  if (isBQ) {
    abilities.push({ kind: "FaceTurn", from: selection, dir: "CW" });
    abilities.push({ kind: "FaceTurn", from: selection, dir: "CCW" });
  }
  if (isRQ) {
    abilities.push({ kind: "LayerTurn", from: selection, axis: "row", dir: "CW" });
    abilities.push({ kind: "LayerTurn", from: selection, axis: "row", dir: "CCW" });
    abilities.push({ kind: "LayerTurn", from: selection, axis: "col", dir: "CW" });
    abilities.push({ kind: "LayerTurn", from: selection, axis: "col", dir: "CCW" });
  }
  return abilities;
}

function triggerAbilityByIndex(index: number): void {
  const abilities = currentAbilities();
  const ability = abilities[index];
  if (!ability || isAnimating) return;

  const face =
    ability.kind === "FaceTurn"
      ? ability.from.face
      : ability.axis === "row"
        ? step(ability.from, ability.from.r === 0 ? "N" : "S").to.face
        : step(ability.from, ability.from.c === 0 ? "W" : "E").to.face;

  isAnimating = true;
  bubble.style.pointerEvents = "none";
  bubble.style.opacity = "0.6";
  scene.animateTurn(face, ability.dir, 500, () => {
    const next = applyAbility(game.board, ability);
    game = { board: next };
    selectionMoves = selection ? legalMoves(game.board, selection) : [];
    scene.setHighlights(selectionMoves);
    scene.sync();
    hud.sync();
    isAnimating = false;
    bubble.style.pointerEvents = "auto";
    bubble.style.opacity = "1";
  });
}

// --- Keyboard shortcuts ---
bindKeyboard({
  selectNextPiece: () => {
    if (isAnimating) return;
    const positions = allPiecePositions();
    if (positions.length === 0) return;
    if (!selection) {
      selectPiece(positions[0]);
      return;
    }
    const idx = positions.findIndex((p) => isSamePos(p, selection!));
    const next = (idx + 1) % positions.length;
    selectPiece(positions[next]);
  },
  selectPrevPiece: () => {
    if (isAnimating) return;
    const positions = allPiecePositions();
    if (positions.length === 0) return;
    if (!selection) {
      selectPiece(positions[positions.length - 1]);
      return;
    }
    const idx = positions.findIndex((p) => isSamePos(p, selection!));
    const prev = (idx - 1 + positions.length) % positions.length;
    selectPiece(positions[prev]);
  },
  deselect: () => {
    if (isAnimating) return;
    deselectAll();
  },
  nextMoveTarget: () => {
    if (!selection || selectionMoves.length === 0 || isAnimating) return;
    moveTargetIndex = (moveTargetIndex + 1) % selectionMoves.length;
    scene.setMoveTarget(selectionMoves[moveTargetIndex]);
  },
  prevMoveTarget: () => {
    if (!selection || selectionMoves.length === 0 || isAnimating) return;
    moveTargetIndex = (moveTargetIndex - 1 + selectionMoves.length) % selectionMoves.length;
    scene.setMoveTarget(selectionMoves[moveTargetIndex]);
  },
  confirmMove: () => {
    if (!selection || isAnimating) return;
    if (moveTargetIndex >= 0 && moveTargetIndex < selectionMoves.length) {
      executeMove(selection, selectionMoves[moveTargetIndex]);
    }
  },
  snapTo: (preset) => scene.snapTo(preset),
  zoomIn: () => scene.zoomIn(),
  zoomOut: () => scene.zoomOut(),
  triggerAbility: (n) => triggerAbilityByIndex(n - 1), // 1-indexed for user, 0-indexed internal
  toggleHud: () => {
    hudVisible = !hudVisible;
    syncHudVisibility();
  },
  resetGame: () => {
    window.location.reload();
  },
});

scene.sync();
hud.sync();
rebuildBubble();
