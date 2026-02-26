import { applyAbility } from "../rules/abilities";
import type { Board } from "../rules/board";
import type { Pos } from "../rules/types";

type HudBindings = {
  getBoard: () => Board;
  setBoard: (board: Board) => void;
};

export function bindHud(bindings: HudBindings): void {
  const btnReset = document.querySelector<HTMLButtonElement>("#btnReset");
  const btnApply = document.querySelector<HTMLButtonElement>("#btnApply");
  const selAbility = document.querySelector<HTMLSelectElement>("#selAbility");
  const selDir = document.querySelector<HTMLSelectElement>("#selDir");
  const hudSelection = document.querySelector<HTMLDivElement>("#hudSelection");

  if (!btnReset || !btnApply || !selAbility || !selDir || !hudSelection) {
    throw new Error("HUD elements missing");
  }

  btnReset.addEventListener("click", () => {
    window.location.reload();
  });

  btnApply.addEventListener("click", () => {
    // MVP wiring: apply ability from a fixed corner to prove mechanics end-to-end quickly.
    // Full selection/picking wiring comes next.
    const from: Pos = { face: "F", r: 0, c: 0 };
    const dir = selDir.value === "CCW" ? "CCW" : "CW";
    const kind = selAbility.value;

    const board = bindings.getBoard();
    let next = board;
    if (kind === "face") next = applyAbility(board, { kind: "FaceTurn", from, dir });
    if (kind === "layer-row") next = applyAbility(board, { kind: "LayerTurn", from, axis: "row", dir });
    if (kind === "layer-col") next = applyAbility(board, { kind: "LayerTurn", from, axis: "col", dir });

    bindings.setBoard(next);
  });

  hudSelection.textContent = "Selection: (MVP placeholder) F:0:0";
}
