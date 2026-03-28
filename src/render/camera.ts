import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";

export type SnapPreset = "F" | "B" | "L" | "R" | "U" | "D" | "I";

export type CameraRig = {
  camera: any;
  controls: any;
  snapTo: (preset: SnapPreset) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  dispose: () => void;
};

function presetDir(preset: SnapPreset): any {
  switch (preset) {
    case "F":
      return new THREE.Vector3(0, 0, 1);
    case "B":
      return new THREE.Vector3(0, 0, -1);
    case "R":
      return new THREE.Vector3(1, 0, 0);
    case "L":
      return new THREE.Vector3(-1, 0, 0);
    case "U":
      return new THREE.Vector3(0, 1, 0);
    case "D":
      return new THREE.Vector3(0, -1, 0);
    case "I":
      return new THREE.Vector3(1, 1, 1).normalize();
  }
}

export function createCameraRig(rendererDom: HTMLCanvasElement, initialSize: { w: number; h: number }): CameraRig {
  rendererDom.style.touchAction = "none";

  const camera = new THREE.PerspectiveCamera(50, initialSize.w / Math.max(1, initialSize.h), 0.1, 200);
  camera.position.set(7, 6, 7);
  camera.lookAt(0, 0, 0);

  const controls = new TrackballControls(camera, rendererDom);
  controls.rotateSpeed = 3.0;
  controls.zoomSpeed = 1.2;
  controls.noPan = true;
  controls.target.set(0, 0, 0);
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.15;
  controls.minDistance = 4;
  controls.maxDistance = 25;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controls.update();

  function snapTo(preset: SnapPreset): void {
    const target = controls.target.clone();
    const d = camera.position.distanceTo(target);
    const dir = presetDir(preset);
    camera.position.copy(target.clone().add(dir.multiplyScalar(d)));
    camera.lookAt(target);
    controls.update();
  }

  function zoomIn(): void {
    const target = controls.target.clone();
    const d = camera.position.distanceTo(target);
    const next = Math.max(controls.minDistance, d * 0.85);
    const dir = camera.position.clone().sub(target).normalize();
    camera.position.copy(target.clone().add(dir.multiplyScalar(next)));
    controls.update();
  }

  function zoomOut(): void {
    const target = controls.target.clone();
    const d = camera.position.distanceTo(target);
    const next = Math.min(controls.maxDistance, d * 1.18);
    const dir = camera.position.clone().sub(target).normalize();
    camera.position.copy(target.clone().add(dir.multiplyScalar(next)));
    controls.update();
  }

  function dispose(): void {
    controls.dispose();
  }

  return { camera, controls, snapTo, zoomIn, zoomOut, dispose };
}
