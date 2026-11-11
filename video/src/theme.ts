import { continueRender, delayRender, staticFile } from 'remotion';

// Fuentes de la marca, incluidas en el proyecto (Google Fonts, licencia OFL) para renderizar sin internet.
const FACES = [
  { family: 'Cinzel', file: 'fonts/Cinzel.woff2', style: 'normal', weight: '400 900' },
  { family: 'Montserrat', file: 'fonts/Montserrat.woff2', style: 'normal', weight: '400 800' },
  { family: 'Montserrat', file: 'fonts/Montserrat-Italic.woff2', style: 'italic', weight: '400 800' },
] as const;

if (typeof document !== 'undefined') {
  const handle = delayRender('Cargando fuentes');
  Promise.all(
    FACES.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, { style: f.style, weight: f.weight });
      document.fonts.add(await face.load());
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}

export const fonts = {
  display: 'Cinzel, Georgia, serif',
  sans: 'Montserrat, Arial, sans-serif',
  italic: 'Montserrat, Arial, sans-serif',
};

// Paleta del sistema de diseño (tema Noche).
export const c = {
  night: '#0b0b0c',
  ink: '#f3ede2',
  muted: '#a39b8c',
  gold: '#c9a45c',
  goldHi: '#e6cd8e',
  goldDeep: '#8c6b30',
  line: '#4a3d26',
};

export const FPS = 30;
export const s = (seconds: number) => Math.round(seconds * FPS);
