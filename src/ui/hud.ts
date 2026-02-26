import { applyAbility, isCorner } from "../rules/abilities";
import type { Board } from "../rules/board";
import { getPiece } from "../rules/board";
import type { Pos } from "../rules/types";
import type { SnapPreset } from "../render/camera";

type HudBindings = {
  getBoard: () => Board;
  setBoard: (board: Board) => void;
  getSelection: () => Pos | null;
  setSelection: (pos: Pos | null) => void;
  getSelectionMoves: () => Pos[];
  snapTo: (preset: SnapPreset) => void;
};

type HudApi = { sync: () => void };

function fmtPos(pos: Pos): string {
  return `${pos.face}:${pos.r}:${pos.c}`;
}

function canFaceTurn(sel: Pos, kind: string): boolean {
  return isCorner(sel) && (kind === "B" || kind === "Q");
}

function canLayerTurn(sel: Pos, kind: string): boolean {
  return isCorner(sel) && (kind === "R" || kind === "Q");
}

export function bindHud(bindings: HudBindings): HudApi {
  const btnReset = document.querySelector<HTMLButtonElement>("#btnReset");
  const btnApply = document.querySelector<HTMLButtonElement>("#btnApply");
  const selAbility = document.querySelector<HTMLSelectElement>("#selAbility");
  const selDir = document.querySelector<HTMLSelectElement>("#selDir");
  const hudSelection = document.querySelector<HTMLDivElement>("#hudSelection");

  if (!btnReset || !btnApply || !selAbility || !selDir || !hudSelection) {
    throw new Error("HUD elements missing");
  }

  const selectionEl = hudSelection;
  const applyBtn = btnApply;
  const abilitySel = selAbility;
  const dirSel = selDir;

  btnReset.addEventListener("click", () => {
    bindings.setSelection(null);
    window.location.reload(); // MVP reset: simple and reliable
  });

  const snapButtons = [
    ["Front", "F"],
    ["Back", "B"],
    ["Left", "L"],
    ["Right", "R"],
    ["Top", "U"],
    ["Bottom", "D"],
    ["Iso", "I"],
  ] as const;

  const row = document.createElement("div");
  row.className = "hud-row";
  for (const [label, preset] of snapButtons) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", () => bindings.snapTo(preset));
    row.appendChild(btn);
  }
  const title = document.createElement("div");
  title.className = "hud-title";
  title.textContent = "Camera";
  const hud = document.querySelector<HTMLElement>("#hud");
  if (!hud) throw new Error("#hud missing");
  hud.appendChild(title);
  hud.appendChild(row);

  btnApply.addEventListener("click", () => {
    const from = bindings.getSelection();
    if (!from) return;
    const dir = dirSel.value === "CCW" ? "CCW" : "CW";
    const kind = abilitySel.value;

    const board = bindings.getBoard();
    const piece = getPiece(board, from);
    if (!piece) return;

    const allowFace = canFaceTurn(from, piece.kind);
    const allowLayer = canLayerTurn(from, piece.kind);

    let next = board;
    if (kind === "face") next = applyAbility(board, { kind: "FaceTurn", from, dir });
    if (kind === "layer-row") next = applyAbility(board, { kind: "LayerTurn", from, axis: "row", dir });
    if (kind === "layer-col") next = applyAbility(board, { kind: "LayerTurn", from, axis: "col", dir });

    if (
      (kind === "face" && !allowFace) ||
      ((kind === "layer-row" || kind === "layer-col") && !allowLayer)
    ) {
      selectionEl.textContent = `Selection: ${fmtPos(from)} (${piece.color}${piece.kind}) - ability not available from here`;
      return;
    }

    if (next === board) {
      selectionEl.textContent = `Selection: ${fmtPos(from)} (${piece.color}${piece.kind}) - rotation had no effect`;
      return;
    }

    bindings.setBoard(next);
  });

  function sync(): void {
    const sel = bindings.getSelection();
    const moves = bindings.getSelectionMoves();
    if (!sel) {
      selectionEl.textContent = `Selection: none (${moves.length} moves)`;
      applyBtn.disabled = true;
      return;
    }

    const piece = getPiece(bindings.getBoard(), sel);
    const label = piece ? `${piece.color}${piece.kind}` : "empty";
    const corner = isCorner(sel) ? "corner" : "not-corner";
    selectionEl.textContent = `Selection: ${fmtPos(sel)} (${label}, ${corner}, ${moves.length} moves)`;

    const optFace = abilitySel.querySelector<HTMLOptionElement>('option[value="face"]');
    const optRow = abilitySel.querySelector<HTMLOptionElement>('option[value="layer-row"]');
    const optCol = abilitySel.querySelector<HTMLOptionElement>('option[value="layer-col"]');

    const allowFace = piece ? canFaceTurn(sel, piece.kind) : false;
    const allowLayer = piece ? canLayerTurn(sel, piece.kind) : false;
    if (optFace) optFace.disabled = !allowFace;
    if (optRow) optRow.disabled = !allowLayer;
    if (optCol) optCol.disabled = !allowLayer;

    if ((abilitySel.value === "face" && !allowFace) || ((abilitySel.value === "layer-row" || abilitySel.value === "layer-col") && !allowLayer)) {
      abilitySel.value = "none";
    }

    applyBtn.disabled = abilitySel.value === "none" || !piece;
  }

  abilitySel.addEventListener("change", sync);
  dirSel.addEventListener("change", sync);

  sync();
  return { sync };
}
