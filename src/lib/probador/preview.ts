// Vista 3D del gemelo sin cámara (para /probador/calibrar): el reloj sobre una muñeca de referencia,
// girando despacio; se puede arrastrar para rotarlo.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { TryOn } from '../../data/pieces';
import { buildTwin, wristGeometry, type Twin } from './twin';

export interface Preview {
  set(t: TryOn): Promise<void>;
  dispose(): void;
}

export function createPreview(canvas: HTMLCanvasElement): Preview {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.DirectionalLight(0xffffff, 1.2));

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
  camera.position.set(0, -40, 175);
  camera.lookAt(0, 4, 16);

  // Muñeca de referencia (mm): antebrazo a lo largo de X, como en el probador.
  const skin = new THREE.Mesh(wristGeometry(220, -0.6), new THREE.MeshStandardMaterial({ color: 0xc8957a, roughness: 0.8 }));

  const pivot = new THREE.Group();
  pivot.add(skin);
  // De cara a la cámara: las 12 hacia arriba de la pantalla, la esfera hacia el espectador.
  pivot.rotation.x = -0.25;
  scene.add(pivot);

  let twin: Twin | null = null;
  let req = 0;
  let yaw = 0, drag: number | null = null, idle = true;

  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; idle = false; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (drag === null) return;
    yaw += (e.clientX - drag) * 0.01;
    drag = e.clientX;
  });
  canvas.addEventListener('pointerup', () => { drag = null; });

  let raf = 0;
  const t0 = performance.now();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const { clientWidth: w, clientHeight: h } = canvas;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    pivot.rotation.y = idle ? Math.sin((performance.now() - t0) / 1800) * 0.5 : yaw;
    renderer.render(scene, camera);
  };
  loop();

  return {
    async set(t) {
      const r = ++req;
      const next = await buildTwin(t, { occluder: false });
      if (r !== req) return next.dispose();
      if (twin) { pivot.remove(twin.root); twin.dispose(); }
      twin = next;
      pivot.add(twin.root);
    },
    dispose() {
      cancelAnimationFrame(raf);
      twin?.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
