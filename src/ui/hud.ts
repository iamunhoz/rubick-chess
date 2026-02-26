import { applyAbility } from "../rules/abilities";
import type { Board } from "../rules/board";
import type { Pos } from "../rules/types";

type HudBindings = {
  getBoard: () => Board;
  setBoard: (board: Board) => void;
  getSelection: () => Pos | null;
  setSelection: (pos: Pos | null) => void;
  getSelectionMoves: () => Pos[];
};

type HudApi = { sync: () => void };

function fmtPos(pos: Pos): string {
  return `${pos.face}:${pos.r}:${pos.c}`;
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

  btnApply.addEventListener("click", () => {
    const from = bindings.getSelection();
    if (!from) return;
    const dir = dirSel.value === "CCW" ? "CCW" : "CW";
    const kind = abilitySel.value;

    const board = bindings.getBoard();
    let next = board;
    if (kind === "face") next = applyAbility(board, { kind: "FaceTurn", from, dir });
    if (kind === "layer-row") next = applyAbility(board, { kind: "LayerTurn", from, axis: "row", dir });
    if (kind === "layer-col") next = applyAbility(board, { kind: "LayerTurn", from, axis: "col", dir });

    bindings.setBoard(next);
  });

  function sync(): void {
    const sel = bindings.getSelection();
    const moves = bindings.getSelectionMoves();
    selectionEl.textContent = `Selection: ${sel ? fmtPos(sel) : "none"} (${moves.length} moves)`;
    applyBtn.disabled = !sel || abilitySel.value === "none";
  }

  abilitySel.addEventListener("change", sync);
  dirSel.addEventListener("change", sync);

  sync();
  return { sync };
}
