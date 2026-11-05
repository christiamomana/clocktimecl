// Motor del probador virtual (prototipo).
// Se carga con import() dinámico SOLO cuando el visitante abre el probador, así que
// three.js y MediaPipe no pesan en el resto del sitio.
//
// Privacidad: el video de la cámara se procesa en el dispositivo (WebAssembly + WebGL).
// Ningún fotograma se envía a un servidor; solo se descargan el runtime y el modelo.

import { FilesetResolver, HandLandmarker, type HandLandmarkerResult, type Landmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// El runtime WASM se sirve desde nuestro propio dominio (Vite lo copia a dist/_astro).
import wasmLoaderSimd from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinarySimd from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';
import wasmLoaderNoSimd from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.js?url';
import wasmBinaryNoSimd from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.wasm?url';

// Modelo de Google, versión fijada (≈7,8 MB). En producción conviene copiarlo a /public.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export interface TryOnOptions {
  container: HTMLElement;
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  /** Diámetro de la caja en mm (sale de pieces.ts). */
  caseMm: number;
  facing: 'user' | 'environment';
  onStatus?: (msg: string) => void;
}

export interface TryOnSession {
  setCaseMm(mm: number): void;
  setFacing(facing: 'user' | 'environment'): Promise<void>;
  /** Invierte la cara (dorso/palma) si la detección de mano izquierda/derecha falla. */
  flip(): void;
  stop(): void;
}

// Índices de los 21 puntos de MediaPipe Hands.
const WRIST = 0, INDEX_MCP = 5, MIDDLE_MCP = 9, PINKY_MCP = 17;

// Medidas aproximadas (mm) del maniquí: muñeca adulta y correa.
const WRIST_RX = 31; // semieje horizontal de la muñeca
const WRIST_RY = 22; // semieje dorso-palma
const STRAP_W = 22;
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

/** Esfera genérica (sin marcas) con las agujas a la hora actual. */
function dialTexture(): { tex: THREE.CanvasTexture; dispose: () => void } {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const now = new Date();
    g.fillStyle = '#101012';
    g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d4b06a';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      g.lineWidth = big ? 12 : 3;
      const r0 = big ? 190 : 215;
      g.beginPath();
      g.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0);
      g.lineTo(256 + Math.sin(a) * 236, 256 - Math.cos(a) * 236);
      g.stroke();
    }
    g.fillStyle = '#e6cd8e';
    g.font = '600 30px Cinzel, Georgia, serif';
    g.textAlign = 'center';
    g.fillText('CLOCK TIME', 256, 170);
    const hand = (angle: number, len: number, w: number, color: string) => {
      g.save(); g.translate(256, 256); g.rotate(angle);
      g.fillStyle = color; g.fillRect(-w / 2, -len, w, len + 24); g.restore();
    };
    const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
    hand(((h + m / 60) / 12) * Math.PI * 2, 120, 14, '#f3ede2');
    hand(((m + s / 60) / 60) * Math.PI * 2, 190, 9, '#f3ede2');
    hand((s / 60) * Math.PI * 2, 205, 3, '#c9a45c');
    g.fillStyle = '#c9a45c'; g.beginPath(); g.arc(256, 256, 12, 0, Math.PI * 2); g.fill();
    tex.needsUpdate = true;
  };
  draw();
  const id = setInterval(draw, 1000);
  return { tex, dispose: () => { clearInterval(id); tex.dispose(); } };
}

/**
 * Reloj placeholder en mm. Ejes locales: X = a lo largo del antebrazo (hacia los dedos, lado de las 3),
 * Y = hacia las 12, Z = normal de la esfera (dorso de la mano). Origen = eje de la muñeca.
 */
function buildWatch(dial: THREE.Texture) {
  const root = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, metalness: 1, roughness: 0.22 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x3a2516, roughness: 0.7 });

  // Oclusor: un cilindro elíptico invisible que tapa la mitad trasera de la correa.
  const occ = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 120, 40),
    new THREE.MeshBasicMaterial({ colorWrite: false }),
  );
  occ.rotation.z = Math.PI / 2; // eje del cilindro = X (antebrazo)
  occ.scale.set(WRIST_RX * 0.98, 1, WRIST_RY * 0.98);
  occ.renderOrder = -1;
  root.add(occ);

  // Correa: anillo abierto alrededor de la muñeca.
  const strap = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, STRAP_W, 48, 1, true), leather);
  leather.side = THREE.DoubleSide;
  strap.rotation.z = Math.PI / 2;
  strap.scale.set(WRIST_RX + 1.5, 1, WRIST_RY + 1.5);
  root.add(strap);

  // Caja + esfera, apoyadas sobre el dorso.
  const head = new THREE.Group();
  const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 64), steel);
  caseMesh.rotation.x = Math.PI / 2; // eje = Z
  head.add(caseMesh);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.42, 64), new THREE.MeshStandardMaterial({ map: dial, roughness: 0.35 }));
  head.add(face);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 20), steel);
  crown.rotation.z = Math.PI / 2;
  head.add(crown);
  root.add(head);

  const setCase = (mm: number) => {
    const thick = Math.max(9, mm * 0.27);
    caseMesh.scale.set(mm, thick, mm);
    face.scale.setScalar(mm);
    face.position.z = thick / 2 + 0.2;
    crown.scale.set(mm, mm, mm);
    crown.position.set(mm * 0.53, 0, 0);
    head.position.z = WRIST_RY + thick / 2;
  };
  return { root, setCase };
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
  const dial = dialTexture();
  const watch = buildWatch(dial.tex);
  watch.setCase(opts.caseMm);
  watch.root.visible = false;
  scene.add(watch.root);
  resize();

  function resize() {
    const w = video.videoWidth || 1280, h = video.videoHeight || 720;
    // Si la cámara rota (vertical/horizontal) cambian las dimensiones del video.
    renderer.setSize(w, h, false);
    camera.right = w; camera.bottom = -h;
    camera.updateProjectionMatrix();
  }

  // Estado suavizado (filtro exponencial simple; un filtro One Euro sería mejor).
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  let scale = 0;
  let lastSeen = 0;
  let lastTs = -1;

  function update(res: HandLandmarkerResult, now: number) {
    const lm = res.landmarks[0], wl = res.worldLandmarks[0];
    if (!lm || !wl) {
      if (now - lastSeen > 350) watch.root.visible = false;
      return;
    }
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
    const fingers = w(MIDDLE_MCP).sub(w(WRIST)).normalize();
    // Con video SIN espejar (lo que recibe MediaPipe), la etiqueta corresponde a la mano real
    // (verificado con las imágenes de prueba de MediaPipe, v1.1.1). "Voltear" corrige si se equivoca.
    const label = res.handedness[0]?.[0]?.categoryName;
    const isRight = (label === 'Right') !== flipped;
    const a = w(INDEX_MCP).sub(w(WRIST)), b = w(PINKY_MCP).sub(w(WRIST));
    const dorsal = isRight ? b.clone().cross(a) : a.clone().cross(b);
    dorsal.addScaledVector(fingers, -dorsal.dot(fingers)).normalize();
    const twelve = dorsal.clone().cross(fingers);
    const m = new THREE.Matrix4().makeBasis(fingers, twelve, dorsal);
    const q = new THREE.Quaternion().setFromRotationMatrix(m);

    // Ancla: desde la muñeca, unos cm hacia el codo (proyectado en imagen).
    const back = fingers.clone().multiplyScalar(-OFFSET_FROM_WRIST * pxPerMm);
    const target = img(WRIST).add(new THREE.Vector3(back.x, back.y, 0));

    const k = watch.root.visible ? 0.45 : 1; // sin suavizado en la primera detección
    pos.lerp(target, k);
    quat.slerp(q, k);
    scale += (pxPerMm - scale) * k;
    lastSeen = now;

    watch.root.position.copy(pos);
    watch.root.quaternion.copy(quat);
    watch.root.scale.setScalar(scale);
    watch.root.visible = true;
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
    setCaseMm: (mm) => watch.setCase(mm),
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
      dial.dispose();
      renderer.dispose();
      removeEventListener('pagehide', onHide);
    },
  };
  return session;
}
