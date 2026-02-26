import "./style.css";

import { createInitialGame } from "./rules/setup";
import { createScene } from "./render/scene";
import { bindHud } from "./ui/hud";

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

const viewport = document.querySelector<HTMLDivElement>("#viewport");
if (!viewport) throw new Error("#viewport not found");

const scene = createScene(viewport, () => game.board);
bindHud({
  getBoard: () => game.board,
  setBoard: (b) => {
    game = { board: b };
    scene.sync();
  },
});

scene.sync();
