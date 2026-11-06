// Achica las fotos en el navegador antes de subirlas: las de celular pesan 5–15 MB y Vercel
// acepta hasta 4,5 MB por petición. El servidor después genera las versiones WebP.
const MAX_SIDE = 2200;

export async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo leer la foto.'))), 'image/jpeg', 0.88),
  );
}

/** Sube varias fotos, una por una, informando el avance. */
export async function uploadFotos(endpoint: string, files: File[], onProgress: (msg: string) => void): Promise<void> {
  for (const [i, file] of files.entries()) {
    onProgress(`Subiendo foto ${i + 1} de ${files.length}…`);
    const body = new FormData();
    body.append('foto', await shrink(file), file.name.replace(/\.\w+$/, '') + '.jpg');
    const res = await fetch(endpoint, { method: 'POST', body });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      throw new Error(`Foto ${i + 1}: ${error}`);
    }
  }
}
