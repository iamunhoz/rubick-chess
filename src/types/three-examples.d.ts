import type { AnimationClip, Camera, Loader, LoadingManager, Object3D } from "three";

declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  export interface GLTF {
    scene: Object3D;
    scenes: Object3D[];
    animations: AnimationClip[];
    cameras: Camera[];
    asset: Record<string, unknown>;
    parser: unknown;
    userData: Record<string, unknown>;
  }

  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    loadAsync(url: string, onProgress?: (event: ProgressEvent<EventTarget>) => void): Promise<GLTF>;
  }
}

declare module "three/examples/jsm/utils/SkeletonUtils.js" {
  import type { Object3D } from "three";

  export function clone<T extends Object3D>(source: T): T;
}
