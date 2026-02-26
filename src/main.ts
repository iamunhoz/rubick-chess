import "./style.css";

import { createInitialGame } from "./rules/setup";
import { applyMove } from "./rules/apply";
import { getPiece } from "./rules/board";
import { legalMoves } from "./rules/moves";
import { createScene } from "./render/scene";
import { bindHud } from "./ui/hud";
import type { Pos } from "./rules/types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app not found");

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

let game = createInitialGame();
let selection: Pos | null = null;
let selectionMoves: Pos[] = [];

const viewport = document.querySelector<HTMLDivElement>("#viewport");
if (!viewport) throw new Error("#viewport not found");

function isSamePos(a: Pos, b: Pos): boolean {
  return a.face === b.face && a.r === b.r && a.c === b.c;
}

const scene = createScene(viewport, () => game.board, {
  onTileClick: (pos) => {
    const board = game.board;
    const clickedPiece = getPiece(board, pos);

    if (selection && selectionMoves.some((p) => isSamePos(p, pos))) {
      game = { board: applyMove(board, selection, pos) };
      selection = null;
      selectionMoves = [];
      scene.setSelected(null);
      scene.setHighlights([]);
      scene.sync();
      hud.sync();
      return;
    }

    if (clickedPiece) {
      selection = pos;
      selectionMoves = legalMoves(board, pos);
      scene.setSelected(pos);
      scene.setHighlights(selectionMoves);
      hud.sync();
      return;
    }

    selection = null;
    selectionMoves = [];
    scene.setSelected(null);
    scene.setHighlights([]);
    hud.sync();
  },
});

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
    scene.setSelected(selection);
    scene.setHighlights(selectionMoves);
  },
  getSelectionMoves: () => selectionMoves,
});

scene.sync();
hud.sync();
