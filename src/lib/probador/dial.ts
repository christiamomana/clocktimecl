// Recorte de la esfera desde la foto de la pieza. Sin dependencias: lo usan el motor y /probador/calibrar.
import type { TryOn } from '../../data/pieces';

export type DialCrop = TryOn['dial'];

const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

/**
 * Dibuja en `canvas` (cuadrado) la elipse de la foto convertida en círculo, con borde suave.
 * Transformación afín: la elipse (centro, radio r·ancho, alto r·ancho·sy, giro rot) → círculo del canvas.
 */
export function drawDial(canvas: HTMLCanvasElement, img: HTMLImageElement, crop: DialCrop): void {
  const N = canvas.width;
  const g = canvas.getContext('2d')!;
  const W = img.naturalWidth, H = img.naturalHeight;
  const R = crop.r * W;
  const sy = crop.sy ?? 1;
  const rot = ((crop.rot ?? 0) * Math.PI) / 180;
  g.save();
  g.clearRect(0, 0, N, N);
  g.beginPath();
  g.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2);
  g.clip();
  // canvas → foto: p = C + Rot(rot)·diag(R, R·sy)·u, con u ∈ [-1, 1]²; invertimos en orden inverso.
  g.translate(N / 2, N / 2);
  g.scale(N / 2 / R, N / 2 / (R * sy));
  g.rotate(-rot);
  g.translate(-crop.x * W, -crop.y * H);
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0);
  g.restore();
  // Viñeta sutil para que el borde del recorte no se vea como un corte duro.
  const v = g.createRadialGradient(N / 2, N / 2, N * 0.42, N / 2, N / 2, N / 2);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = v;
  g.beginPath();
  g.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2);
  g.fill();
}
