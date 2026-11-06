// Gemelo paramétrico de un reloj, en milímetros, construido con three.js a partir de `TryOn` (pieces.ts).
//
// Ejes locales: X = a lo largo del antebrazo (hacia los dedos, lado de las 3), Y = hacia las 12,
// Z = normal de la esfera (dorso de la mano). Origen = eje de la muñeca, para que la correa la rodee.
import * as THREE from 'three';
import type { TryOn } from '../../data/pieces';
import { drawDial, loadImage } from './dial';

/**
 * Sección de la muñeca adulta promedio (mm): superelipse, más plana en el dorso que un óvalo.
 * MediaPipe estima manos de tamaño medio, así que no tiene sentido adaptarla a cada visitante.
 */
export const WRIST = { rx: 31, ry: 22, n: 3 };

/** Punto del contorno de la muñeca (agrandado en `grow` mm) para el ángulo a; y = hacia las 12, z = dorso. */
function wristPoint(a: number, grow: number): [number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  return [
    Math.sign(c) * Math.abs(c) ** (2 / WRIST.n) * (WRIST.rx + grow),
    Math.sign(s) * Math.abs(s) ** (2 / WRIST.n) * (WRIST.ry + grow),
  ];
}

/** Altura (z) del contorno de la muñeca a la distancia y del centro, por el lado del dorso. */
export function wristTopZ(y: number, grow = 0): number {
  const rx = WRIST.rx + grow, ry = WRIST.ry + grow;
  return ry * Math.max(0, 1 - Math.abs(y / rx) ** WRIST.n) ** (1 / WRIST.n);
}

/** Antebrazo macizo de largo `len` a lo largo de X (oclusor en el probador, piel en la vista previa). */
export function wristGeometry(len: number, grow = 0): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const [y, z] = wristPoint((i / N) * Math.PI * 2, grow);
    if (i === 0) shape.moveTo(y, z);
    else shape.lineTo(y, z);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false, curveSegments: 1 });
  // Forma en XY extruida en Z → (X de la forma = Y, Y de la forma = Z, extrusión = X).
  g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)));
  g.translate(-len / 2, 0, 0);
  g.computeVertexNormals();
  return g;
}

/** Cinta abierta (la correa) de ancho `width` alrededor de la muñeca. */
function bandGeometry(width: number, grow: number): THREE.BufferGeometry {
  const N = 96;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const [y, z] = wristPoint((i / N) * Math.PI * 2, grow);
    pos.push(-width / 2, y, z, width / 2, y, z);
    uv.push(0, i / N, 1, i / N);
    if (i < N) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const METALS: Record<TryOn['metal'], { color: number; roughness: number }> = {
  steel: { color: 0xd9d6cf, roughness: 0.22 },
  'rose-gold': { color: 0xe3a387, roughness: 0.25 },
  'yellow-gold': { color: 0xe8c27a, roughness: 0.25 },
};

const STRAPS: Record<TryOn['strap'], { color: number; roughness: number; metal?: boolean }> = {
  'leather-tan': { color: 0x9a6a3e, roughness: 0.75 },
  'leather-brown': { color: 0x3b2116, roughness: 0.7 },
  'leather-black': { color: 0x141211, roughness: 0.6 },
  'leather-navy': { color: 0x18223a, roughness: 0.65 },
  'rubber-black': { color: 0x0f0f10, roughness: 0.9 },
  'bracelet-steel': { color: 0xcfccc4, roughness: 0.3, metal: true },
};

/** Valores por defecto para cuando una pieza no tiene gemelo: reloj redondo genérico. */
export function genericTwin(caseMm = 40): TryOn {
  return {
    shape: 'round', caseMm, thickMm: Math.max(10, caseMm * 0.27), lugMm: Math.round(caseMm * 0.5),
    metal: 'steel', strap: 'leather-brown', dial: { src: '', x: 0.5, y: 0.5, r: 0.5 },
  };
}

/** Contorno de la caja (mm, centrado). round = círculo; cushion/tonneau = superelipse. */
function outline(t: TryOn): THREE.Shape {
  const R = t.caseMm / 2;
  const [n, sx, sy] = t.shape === 'cushion' ? [4.2, 1, 1] : t.shape === 'tonneau' ? [3, 1, 1.08] : [2, 1, 1];
  const s = new THREE.Shape();
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a), si = Math.sin(a);
    const x = Math.sign(c) * Math.abs(c) ** (2 / n) * R * sx;
    const y = Math.sign(si) * Math.abs(si) ** (2 / n) * R * sy;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

/** Textura de la esfera: recorte de la foto o, si no hay foto, esfera genérica con la hora actual. */
async function dialTexture(t: TryOn): Promise<{ tex: THREE.CanvasTexture; dispose: () => void }> {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (t.dial.src) {
    try {
      drawDial(c, await loadImage(t.dial.src), t.dial);
      tex.needsUpdate = true;
      return { tex, dispose: () => tex.dispose() };
    } catch {
      /* cae a la esfera genérica */
    }
  }
  const g = c.getContext('2d')!;
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

/** Textura de eslabones para el brazalete (franjas a lo largo de la correa). */
function linksTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#7d7a73';
  g.fillRect(0, 0, 64, 4); // separación entre eslabones
  g.fillRect(20, 0, 2, 64); g.fillRect(42, 0, 2, 64); // eslabón central
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 60);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface Twin {
  root: THREE.Group;
  dispose(): void;
}

export async function buildTwin(t: TryOn, opts: { occluder?: boolean } = {}): Promise<Twin> {
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const root = new THREE.Group();
  const R = t.caseMm / 2;
  const thick = t.thickMm;
  const m = METALS[t.metal];
  const metal = keep(new THREE.MeshStandardMaterial({ color: m.color, metalness: 1, roughness: m.roughness, side: THREE.DoubleSide }));

  // Oclusor: cilindro elíptico invisible (la muñeca) que tapa la parte trasera de la correa.
  if (opts.occluder !== false) {
    const occ = new THREE.Mesh(keep(wristGeometry(140, -0.6)), keep(new THREE.MeshBasicMaterial({ colorWrite: false })));
    occ.renderOrder = -1;
    root.add(occ);
  }

  // Correa / brazalete: anillo abierto alrededor de la muñeca, del ancho entre asas.
  const st = STRAPS[t.strap];
  const strapMat = keep(new THREE.MeshStandardMaterial({
    color: st.color, roughness: st.roughness, metalness: st.metal ? 1 : 0, side: THREE.DoubleSide,
    map: st.metal ? keep(linksTexture()) : null,
  }));
  const band = (width: number, grow: number) => new THREE.Mesh(keep(bandGeometry(width, grow)), strapMat);
  root.add(band(t.lugMm, st.metal ? 2.5 : 1.8)); // mismo `grow` que usan las asas más abajo
  if (!st.metal) root.add(band(t.lugMm * 0.9, 1.0)); // forro interior, da grosor visual a la correa

  // Cabeza del reloj, apoyada sobre el dorso.
  const head = new THREE.Group();
  head.position.z = WRIST.ry + 1;
  root.add(head);

  // Carrura: contorno extruido con bisel suave.
  const bevel = Math.min(2.2, thick * 0.18);
  const caseGeo = keep(new THREE.ExtrudeGeometry(outline(t), {
    depth: thick * 0.62 - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8,
    bevelSegments: 4, curveSegments: 64,
  }));
  caseGeo.translate(0, 0, bevel);
  const caseMesh = new THREE.Mesh(caseGeo, metal);
  // La superelipse se escala un poco hacia dentro para que el bisel no la agrande.
  caseMesh.scale.set(1 - (bevel * 0.8) / R, 1 - (bevel * 0.8) / R, 1);
  head.add(caseMesh);

  // Bisel/aro y esfera (siempre redonda, también dentro de cajas cojín o barril).
  const face = t.dial.face ?? 0.86;
  const top = thick * 0.62;
  const bezelR = R * Math.min(0.99, face + 0.08);
  const bezel = new THREE.Mesh(
    keep(new THREE.LatheGeometry(
      [new THREE.Vector2(R * face, top + 0.4), new THREE.Vector2(bezelR, top + 0.6), new THREE.Vector2(bezelR, top - 0.5)].reverse(),
      96,
    )),
    metal,
  );
  bezel.rotation.x = Math.PI / 2; // eje del torno (Y) → Z
  head.add(bezel);

  const dial = await dialTexture(t);
  disposables.push(dial);
  const dialMesh = new THREE.Mesh(
    keep(new THREE.CircleGeometry(R * face, 96)),
    keep(new THREE.MeshStandardMaterial({ map: dial.tex, roughness: 0.45, metalness: 0 })),
  );
  dialMesh.position.z = top + 0.05;
  head.add(dialMesh);

  // Cristal: casquete casi transparente y levemente abombado que refleja el entorno.
  const DOME = 5; // radio de la esfera del cristal / radio de la esfera del reloj
  const glass = new THREE.Mesh(
    keep(new THREE.SphereGeometry(R * face * DOME, 64, 8, 0, Math.PI * 2, 0, Math.asin(1 / DOME))),
    keep(new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.04, transparent: true, opacity: 0.14, depthWrite: false })),
  );
  glass.rotation.x = Math.PI / 2;
  glass.position.z = top + 0.6 - R * face * DOME * Math.cos(Math.asin(1 / DOME));
  head.add(glass);

  // Asas: cuatro patas en las 12 y las 6, a ambos lados de la correa, inclinadas hasta tocar la correa.
  const grow = st.metal ? 2.5 : 1.8;
  const bandZ = (y: number) => wristTopZ(y, grow) - head.position.z; // altura de la correa relativa a la cabeza
  const lugIn = R * 0.8;
  const lugLen = R * 0.35 + (t.shape === 'round' ? 3 : 1.5);
  const zIn = thick * 0.3;
  const zOut = Math.min(zIn, bandZ(lugIn + lugLen) + 1.2);
  const tilt = Math.atan2(zIn - zOut, lugLen);
  const lugGeo = keep(new THREE.BoxGeometry(t.shape === 'cushion' ? 1.6 : 2.6, Math.hypot(lugLen, zIn - zOut), thick * 0.32));
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const lug = new THREE.Mesh(lugGeo, metal);
      lug.position.set(sx * (t.lugMm / 2 + 1.3), sy * (lugIn + lugLen / 2), (zIn + zOut) / 2);
      lug.rotation.x = -sy * tilt; // la punta exterior baja hacia la muñeca
      head.add(lug);
    }
  }

  // Corona a las 3 (+X).
  const crown = new THREE.Mesh(keep(new THREE.CylinderGeometry(R * 0.13, R * 0.13, 4, 24)), metal);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(R * (t.shape === 'round' ? 1 : 1.02) + 2, 0, thick * 0.33);
  head.add(crown);

  return {
    root,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
