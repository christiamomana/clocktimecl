# Video "Nuestra historia"

Reel vertical (1080×1920, 30 fps, 73 s) con la historia de ClockTime Chile, hecho con [Remotion](https://www.remotion.dev) (React + TypeScript).

```bash
cd video
npm install
npm run studio   # editor en el navegador, para ver y ajustar escenas
npm run render   # genera out/historia-vertical.mp4
```

- `src/Historia.tsx`: escenas, textos y duraciones (lista `SCENES`).
- `src/Watch.tsx`: el reloj ilustrado (esfera y mecanismo), el mismo de `/historia`.
- `src/parts.tsx`: fundidos, textos que entran, fotos con acercamiento lento y el área segura de los reels.
- `public/`: fotos de la vitrina, logo y fuentes. Cinzel y Montserrat vienen de Google Fonts, con licencia SIL Open Font License; están incluidas para renderizar sin internet.

Sin audio: la música se agrega al publicar en Instagram (biblioteca con licencia). Si se graba una voz, se suma con `<Audio>` de Remotion.
