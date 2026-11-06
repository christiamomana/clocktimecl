// Motor del probador virtual (prototipo).
// Se carga con import() dinámico SOLO cuando el visitante abre el probador, así que
// three.js y MediaPipe no pesan en el resto del sitio.
//
// Privacidad: el video de la cámara se procesa en el dispositivo (WebAssembly + WebGL).
// Ningún fotograma se envía a un servidor; solo se descargan el runtime y el modelo.

import { FilesetResolver, HandLandmarker, type HandLandmarkerResult, type Landmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { TryOn } from '../../data/pieces';
import { OneEuro, OneEuroN } from './filter';
import { buildTwin, type Twin } from './twin';

// El runtime WASM se sirve desde nuestro propio dominio (Vite lo copia a dist/_astro).
import wasmLoaderSimd from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinarySimd from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';
import wasmLoaderNoSimd from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.js?url';
import wasmBinaryNoSimd from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.wasm?url';

// Modelo de Google (hand_landmarker/float16/1, Apache-2.0, ≈7,8 MB) servido desde nuestro dominio:
// así la IP del visitante no llega a terceros. Origen y sha256 en public/models/README.md.
const MODEL_URL = '/models/hand_landmarker.task';

export interface TryOnOptions {
  container: HTMLElement;
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  /** Gemelo paramétrico de la pieza (pieces.ts). */
  twin: TryOn;
  facing: 'user' | 'environment';
  onStatus?: (msg: string) => void;
}

export interface TryOnSession {
  setPiece(twin: TryOn): Promise<void>;
  setFacing(facing: 'user' | 'environment'): Promise<void>;
  /** Invierte la cara (dorso/palma) si la detección de mano izquierda/derecha falla. */
  flip(): void;
  stop(): void;
}

// Índices de los 21 puntos de MediaPipe Hands.
const WRIST = 0, INDEX_MCP = 5, MIDDLE_MCP = 9, PINKY_MCP = 17;

const OFFSET_FROM_WRIST = 32; // la caja va ~3 cm hacia el codo desde el pliegue de la muñeca

let landmarkerPromise: Promise<HandLandmarker> | null = null;

async function getLandmarker(): Promise<HandLandmarker> {
  landmarkerPromise ??= (async () => {
    const simd = await FilesetResolver.isSimdSupported();
    const fileset = simd
      ? { wasmLoaderPath: wasmLoaderSimd, wasmBinaryPath: wasmBinarySimd }
      : { wasmLoaderPath: wasmLoaderNoSimd, wasmBinaryPath: wasmBinaryNoSimd };
    const make = (delegate: 'GPU' | 'CPU') =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
    try {
      return await make('GPU');
    } catch {
      return make('CPU'); // algunos Android de gama media fallan con el delegado GPU
    }
  })();
  return landmarkerPromise;
}

// Conversión de coordenadas MediaPipe (x der, y abajo, z hacia la cámara negativo) a three (y arriba, z hacia la cámara).
// La profundidad (z) de worldLandmarks es la coordenada más ruidosa: se atenúa para que el reloj no "cabecee".
const Z_DAMP = 0.5;
const toThree = (p: Landmark) => new THREE.Vector3(p.x, -p.y, -p.z * Z_DAMP);

export async function startTryOn(opts: TryOnOptions): Promise<TryOnSession> {
  const { container, video, canvas, onStatus } = opts;
  let facing = opts.facing;
  let flipped = false;
  let stream: MediaStream | null = null;
  let raf = 0;
  let stopped = false;

  const status = (m: string) => onStatus?.(m);

  async function openCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    video.srcObject = stream;
    await video.play();
    // Con la cámara frontal mostramos espejo (como un selfie). Solo se espeja el CSS: MediaPipe recibe la imagen real.
    container.classList.toggle('is-mirrored', facing === 'user');
  }

  status('Cargando el modelo de seguimiento…');
  const [landmarker] = await Promise.all([getLandmarker(), openCamera()]);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.DirectionalLight(0xffffff, 1.2));

  // Cámara ortográfica en píxeles de video: (0,0) arriba a la izquierda.
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -5000, 5000);
  // Contenedor que sigue a la mano; el gemelo se cambia dentro sin tocar el seguimiento.
  const anchor = new THREE.Group();
  anchor.visible = false;
  scene.add(anchor);
  let twin: Twin | null = null;
  let twinReq = 0;
  async function setPiece(t: TryOn) {
    const req = ++twinReq;
    const next = await buildTwin(t);
    if (req !== twinReq || stopped) return next.dispose(); // llegó otra pieza mientras cargaba
    if (twin) { anchor.remove(twin.root); twin.dispose(); }
    twin = next;
    anchor.add(twin.root);
  }
  await setPiece(opts.twin);
  resize();

  function resize() {
    const w = video.videoWidth || 1280, h = video.videoHeight || 720;
    // Si la cámara rota (vertical/horizontal) cambian las dimensiones del video.
    renderer.setSize(w, h, false);
    camera.right = w; camera.bottom = -h;
    camera.updateProjectionMatrix();
  }

  // Suavizado One Euro: posición (px), escala (px/mm) y los dos ejes de la mano (vectores unitarios).
  const fPos = new OneEuroN(2, 1.0, 0.015);
  const fScale = new OneEuro(0.6, 0.3);
  const fFingers = new OneEuroN(3, 1.0, 0.4);
  const fDorsal = new OneEuroN(3, 1.0, 0.4);
  const resetFilters = () => [fPos, fScale, fFingers, fDorsal].forEach((f) => f.reset());
  let lastSeen = 0;
  let lastTs = -1;

  function update(res: HandLandmarkerResult, now: number) {
    const lm = res.landmarks[0], wl = res.worldLandmarks[0];
    if (!lm || !wl) {
      if (now - lastSeen > 350 && anchor.visible) {
        anchor.visible = false;
        resetFilters(); // al reaparecer, que salte directo a la mano y no "vuele" desde la posición vieja
      }
      return;
    }
    const t = now / 1000;
    const W = video.videoWidth, H = video.videoHeight;
    const img = (i: number) => new THREE.Vector3(lm[i].x * W, -lm[i].y * H, 0);
    const w = (i: number) => toThree(wl[i]);

    // Escala px/mm: desplazamientos en imagen vs. en mundo (metros) en el plano XY (perspectiva débil).
    let sImg = 0, sWorld = 0;
    for (const [a, b] of [[WRIST, INDEX_MCP], [WRIST, PINKY_MCP], [INDEX_MCP, PINKY_MCP], [WRIST, MIDDLE_MCP]]) {
      sImg += img(a).distanceTo(img(b));
      const d = w(a).sub(w(b)); d.z = 0;
      sWorld += d.length() * 1000;
    }
    if (sWorld < 1e-3) return;
    const pxPerMm = sImg / sWorld;

    // Base de la mano en 3D.
    // Con video SIN espejar (lo que recibe MediaPipe), la etiqueta corresponde a la mano real
    // (verificado con las imágenes de prueba de MediaPipe, v1.1.1). "Voltear" corrige si se equivoca.
    const label = res.handedness[0]?.[0]?.categoryName;
    const isRight = (label === 'Right') !== flipped;
    const a = w(INDEX_MCP).sub(w(WRIST)), b = w(PINKY_MCP).sub(w(WRIST));
    const rawFingers = w(MIDDLE_MCP).sub(w(WRIST)).normalize();
    const rawDorsal = (isRight ? b.clone().cross(a) : a.clone().cross(b)).normalize();
    const fingers = new THREE.Vector3(...fFingers.filter(rawFingers.toArray(), t)).normalize();
    const dorsal = new THREE.Vector3(...fDorsal.filter(rawDorsal.toArray(), t));
    dorsal.addScaledVector(fingers, -dorsal.dot(fingers)).normalize();
    const twelve = dorsal.clone().cross(fingers);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(fingers, twelve, dorsal));

    // Ancla: desde la muñeca, unos cm hacia el codo (proyectado en imagen).
    const scale = fScale.filter(pxPerMm, t);
    const back = rawFingers.clone().multiplyScalar(-OFFSET_FROM_WRIST * pxPerMm);
    const target = img(WRIST).add(new THREE.Vector3(back.x, back.y, 0));
    const [px, py] = fPos.filter([target.x, target.y], t);
    lastSeen = now;

    anchor.position.set(px, py, 0);
    anchor.quaternion.copy(q);
    anchor.scale.setScalar(scale);
    anchor.visible = true;
  }

  const loop = () => {
    if (stopped) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) resize();
    const now = performance.now();
    if (now <= lastTs) return; // MediaPipe exige timestamps crecientes
    lastTs = now;
    update(landmarker.detectForVideo(video, now), now);
    renderer.render(scene, camera);
  };
  status('Muestra el dorso de tu mano y la muñeca a la cámara.');
  loop();

  const onHide = () => session.stop();
  addEventListener('pagehide', onHide);

  const session: TryOnSession = {
    setPiece,
    async setFacing(f) {
      facing = f;
      await openCamera();
      resize();
    },
    flip() { flipped = !flipped; },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      twin?.dispose();
      renderer.dispose();
      removeEventListener('pagehide', onHide);
    },
  };
  return session;
}
