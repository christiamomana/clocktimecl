# Probador virtual de relojes con realidad aumentada — investigación

*Clock Time Chile · noviembre de 2026 · rama `claude/ar-probador-investigacion`*

> **Convención:** **[Hecho]** = respaldado por la fuente enlazada. **[Medido]** = lo medimos en este repo.
> **[Estimación]** = juicio propio o cifra de terceros no verificada. Cuando la única fuente es del propio
> proveedor o un sitio secundario, se indica.

---

## 0. Resumen ejecutivo

- **Se puede hacer sin app y sin pagar licencias.** Con MediaPipe Hand Landmarker (seguimiento de la mano en el
  navegador) + Three.js (render) se dibuja un reloj sobre la muñeca en iOS Safari y Android Chrome. En esta rama
  queda un **prototipo funcional** en `/probador`.
- **WebXR no sirve para esto en iPhone** (Safari iOS no soporta `immersive-ar`) y, aunque sirviera, WebXR en
  teléfonos no entrega seguimiento de manos. La vía universal es *cámara + visión por computador en JS*.
- **AR Quick Look (USDZ) y Scene Viewer (GLB)** sirven para “ver el reloj en tu espacio” (sobre la mesa), **no**
  para ponerlo en la muñeca. Es un buen complemento, barato si ya se tiene un GLB.
- **El cuello de botella es el modelo 3D, no el código.** Los relojes (acero pulido, zafiro) son el peor caso para
  fotogrametría y escaneo con iPhone, y como cada pieza es **única y de segunda mano**, un modelo a medida se
  amortiza en una sola venta. **Recomendación:** un *gemelo paramétrico* por pieza (caja genérica con el diámetro,
  forma y correa correctos + la esfera tomada de la foto real del reloj), en vez de modelos fotorrealistas.
- **SDKs comerciales** (Perfect Corp, DeepAR, Banuba, Snap Camera Kit) existen, pero o cotizan a precio
  empresarial, o no confirman seguimiento de muñeca en web. No se justifican antes de validar uso real.
- **Plan:** Fase 0 (hecha) prototipo genérico → Fase 1 (≈ 1,5–2 semanas) gemelos paramétricos + botón
  “Pruébatelo” en cada ficha → Fase 2 (opcional) “Ver en 3D / en tu espacio” con `<model-viewer>` → Fase 3 evaluar
  un SDK solo si el uso lo justifica.

---

## 1. Opciones técnicas

### 1.1 Seguimiento de mano y muñeca en el navegador

| Opción | Qué entrega | Licencia / costo | Comentario |
|---|---|---|---|
| **MediaPipe Hand Landmarker** (`@mediapipe/tasks-vision`) | 21 puntos por mano en imagen (normalizados) y en “mundo” (metros), más mano izquierda/derecha | Apache-2.0, gratis | **Elegida para el prototipo.** |
| TensorFlow.js (modelos *hand-pose-detection*) | Mismos 21 puntos (familia de modelos MediaPipe) | Apache-2.0 | **[Estimación]** Aporta poco frente a usar MediaPipe Tasks directo; más capas y más peso. |
| SDK comercial (ver §1.5) | Seguimiento de muñeca dedicado, oclusión, materiales | Pago | Calidad potencialmente mejor; costo y dependencia. |

**[Hecho]** El Hand Landmarker web se configura con `runningMode: "VIDEO"`, `numHands`, umbrales de confianza y
`baseOptions.delegate: "GPU"`; `detectForVideo(frame, timestampMs)` es síncrono y exige timestamps crecientes.
Devuelve `landmarks` (21 puntos, x/y normalizados), `worldLandmarks` (21 puntos en metros, origen en el centro de
la mano) y `handedness` (izquierda/derecha con *score*).
Fuente: <https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js>

**Limitación clave [Hecho/Estimación]:** MediaPipe no tiene un “punto de muñeca” pensado para relojes: el punto 0
es la base de la palma. El reloj se ubica **extrapolando** unos 3 cm hacia el codo, y su orientación se calcula con
el plano de la palma. Snap, que sí tiene un componente dedicado, advierte que *el seguimiento se degrada a medida
que el objeto se aleja de la muñeca hacia el antebrazo* y recomienda mantener el modelo a ~4 cm de la muñeca
([Lens Studio – Wristwear Try-On](https://developers.snap.com/lens-studio/features/try-on/wristwear-try-on)).
Lo mismo aplica, con más razón, a nuestra extrapolación.

### 1.2 Render 3D

| Opción | Uso aquí | Comentario |
|---|---|---|
| **Three.js** (vanilla) | Overlay del reloj sobre el video | **Elegida.** Cero dependencias extra en Astro; ~180 KB gzip junto con MediaPipe JS **[Medido]**. |
| React Three Fiber | Igual, en JSX | Cómodo si el dueño prefiere React, pero exige `@astrojs/react` + React en la isla (**[Estimación]** +45–50 KB gzip). No aporta nada funcional para un solo objeto. Reconsiderar si el probador crece (configurador de correas, etc.). |
| **`<model-viewer>`** (Google) | Visor 3D + botón AR “ver en tu espacio” | Ideal para la Fase 2; no hace seguimiento de mano. |

### 1.3 WebXR y su soporte real en iOS

- **[Hecho, fuentes secundarias 2026]** Safari en iPhone/iPad **no** soporta la WebXR Device API ni sesiones
  `immersive-ar`, y Apple no ha anunciado planes. Los *flags* experimentales vistos en betas antiguas (iOS 15.4)
  nunca se convirtieron en soporte. Fuentes:
  [Born Digital – WebXR standards 2026](https://born-astro.pages.dev/insights/webxr-standards-2026/),
  [TestMu – WebXR compatible browsers](https://www.testmuai.com/learning-hub/webxr-compatible-browsers/),
  [Road to VR (beta iOS, histórico)](https://roadtovr.com/?p=170884). No encontré nota oficial de WebKit que lo
  confirme; es la situación de facto.
- **[Estimación]** En Android Chrome, WebXR `immersive-ar` funciona sobre ARCore, pero ofrece detección de
  planos/superficies, **no** seguimiento de manos en teléfonos (el módulo *Hand Input* de WebXR está pensado para
  visores). Por lo tanto, **WebXR no resuelve el probador de muñeca en ningún móvil**.

### 1.4 AR Quick Look (USDZ) y Scene Viewer (GLB): “ver en tu espacio”

- **[Hecho]** `<model-viewer>` acepta `ar-modes="webxr scene-viewer quick-look"`. Si no se entrega `ios-src`, el
  USDZ para Quick Look **se genera automáticamente** en el iPhone al tocar el botón AR (sin animaciones). WebXR
  requiere HTTPS. Fuentes: [model-viewer – ejemplos AR](https://modelviewer.dev/examples/augmentedreality/),
  [issue de iOS 17.5 (ya resuelto)](https://www.github.com/google/model-viewer/issues/4746).
- **[Hecho]** Scene Viewer (Android) se lanza con un *intent* desde una página web, recibe la URL de un glTF/GLB y
  tiene modos `3d_preferred` (por defecto) y `ar_preferred`; si falta Google Play Services for AR cae a 3D.
  Fuente: [ARCore – Scene Viewer](https://developers.google.com/ar/develop/scene-viewer?hl=pt-br).
- **Para qué sirve aquí:** dejar el reloj en tamaño real sobre la mesa o la mano extendida para dimensionar la caja
  (47 mm de un Radiomir vs. 36 mm de un Movado). **No** lo pone en la muñeca. Costo marginal bajo una vez que existe
  un GLB.

### 1.5 SDKs comerciales de *virtual try-on* de relojes

| Proveedor | ¿Relojes en web? | Precio | Notas |
|---|---|---|---|
| **Perfect Corp (YouCam) – AR Watch** | **[Hecho, proveedor]** Sí: web, iOS y Android, *white-label*; API REST, módulo web y SDK móvil. Promete “2D-to-3D rapid deployment” sin detallar. | **Solo cotización.** Un sitio de terceros estima 30.000–150.000+ USD/año para SDK empresarial **[no verificado]**. El plan Shopify público (desde 379 USD/mes) no cubre relojes. | [AR Watch](https://perfectcorp.com/business/products/ar-watch) · [Watch try-on API](https://yce.perfectcorp.com/ai-api/contents/virtual-watch-try-on) · [estimación de terceros](https://www.ki-syndikat.de/tools/perfect-corp/) · [plan Shopify](https://www.perfectcorp.com/business/plan/shopify) |
| **DeepAR** | **No confirmado** en su página de precios ni en lo revisado. Fuerte en cara. | **[Hecho]** Por MAU: gratis hasta 10 MAU con marca de agua; 25 USD/mes (1k MAU), 100 (5k), 500 (30k), 1.000 (100k); más: ventas. | [Precios DeepAR](https://docs.deepar.ai/deepar-sdk/pricing) |
| **Banuba** | Hand tracking para anillos y pulseras **[Hecho, proveedor]**; relojes no confirmado. Tiene Web SDK (JS/TS). | Plataforma no-code 49–349 USD/mes; SDK a cotización **[proveedor, no verificado]**. | [Banuba try-on](https://www.banuba.com/e-commerce-virtual-try-on) |
| **Snap Camera Kit** | Lens Studio tiene plantilla *Wristwear Try-On* y lista Camera Kit como plataforma **[Hecho]**. En **Camera Kit Web** hay reportes de que el seguimiento de muñeca no funciona y un comentario de que Snap “no acepta try-on en Camera Kit” **[foro, no verificado]**. | Requiere acuerdo con Snap. | [Wristwear Try-On](https://developers.snap.com/lens-studio/features/try-on/wristwear-try-on) · [foro Camera Kit Web](https://community.snap.com/snapar/discussion/comment/4558) |
| **8th Wall (Niantic)** | Tenía hand/wrist tracking en WebAR. | **[Hecho]** La plataforma hospedada cerró el **28-feb-2026**; el motor se liberó como código abierto (MIT, el SLAM como binario). Según la prensa, **Hand Tracking no se incluyó** en la liberación. | [Road to VR](https://www.roadtovr.com/niantic-webar-platform-8th-wall-open-source/) · [8thwall.org – migración](https://8thwall.org/docs/migration) |

**Lectura [Estimación]:** para una tienda de un local con piezas únicas, Perfect Corp es sobredimensionado en costo;
DeepAR/Banuba no garantizan muñeca en web; Snap tiene dudas de política y de web; 8th Wall ya no es opción para
manos. Ninguno resuelve el problema real (el modelo 3D de cada pieza única) mejor que el enfoque propio.

---

## 2. El modelo 3D de cada reloj

### 2.1 De dónde sale

| Vía | Calidad para relojes | Costo / tiempo por pieza | Comentario |
|---|---|---|---|
| **Escaneo con iPhone / Object Capture** | Mala | Bajo (1–2 h) | **[Hecho]** Apple recomienda evitar objetos reflectantes, transparentes o con estructuras muy delgadas ([WWDC23 – Object Capture](https://developer.apple.com/videos/play/wwdc2023/10191/)). Un reloj es las tres cosas: acero pulido, zafiro, agujas finas. Pruebas de estudio confirman artefactos y la necesidad de polarización cruzada + edición manual ([PhotoRobot](https://www.photorobot.com/tutorials/object-capture-how-to-make-a-3d-model)). |
| **Fotogrametría profesional** (polarización cruzada, spray matificante) | Media | Medio | El spray no es aceptable en una pieza de cliente/consignación **[Estimación]**. Igual requiere retopología y materiales a mano. |
| **Modelado por encargo** (Blender/CAD) | Alta | **[Estimación de terceros, no verificada]** 50–500 USD freelance; 1.000–5.000 USD nivel marca ([Hitem3D FAQ](https://www.hitem3d.ai/ai-faq/what-is-the-cost-of-a-watch-3d-model-for-freelancers)); 3–10 días | Hay oferta en Fiverr/CGTrader ([ejemplo](https://fiverr.com/joshmalik1/create-realistic-3d-wrist-watch-modeling-rendering-and-animation)). Alto para una pieza que se vende una vez. |
| **Marketplaces** (CGTrader, TurboSquid, Sketchfab) | Variable | 10–150 USD **[Estimación]** | Suelen ser el modelo *de catálogo*, no la pieza concreta (pátina, correa, esfera envejecida). Ver §2.3 (marcas). |
| **Gemelo paramétrico** *(recomendado)* | Suficiente para **tamaño y presencia** | **[Estimación]** 20–40 min por pieza, sin costo externo | Plantillas de caja (redonda, cojín Panerai, tonneau/integrada tipo Cosmic) parametrizadas por diámetro, grosor, ancho de asas y color de correa; la **esfera es un recorte de la foto real** que la tienda ya tiene en `public/img`. |

### 2.2 Formatos y peso

- **GLB (glTF binario):** formato de trabajo para Three.js, `<model-viewer>` y Scene Viewer.
- **USDZ:** solo para AR Quick Look en iOS; `<model-viewer>` puede generarlo al vuelo (§1.4).
- **[Estimación]** Objetivo por pieza: **< 1,5 MB** GLB (≤ 30k triángulos, texturas 1024² en KTX2/WebP,
  geometría con Meshopt o Draco). Un reloj ocupa poca pantalla; más detalle no se nota en la muñeca.
- **[Estimación]** El gemelo paramétrico pesa **≈ 50–150 KB** por pieza (solo la textura de esfera + parámetros):
  la geometría se genera en el cliente, como hace el prototipo.

### 2.3 Piezas únicas de segunda mano y marcas registradas

- **[Estimación]** Un modelo a medida se amortiza en **una sola venta** (no hay stock repetido). Por eso el costo por
  pieza debe acercarse a cero → gemelo paramétrico, no modelado fotorrealista.
- **[Estimación, no es asesoría legal]** Revender un reloj auténtico y nombrar la marca para describirlo es
  práctica normal. Distinto es **fabricar una réplica 3D** con logos, diseño de esfera y formas protegidas (p. ej. la
  caja cojín y el puente de corona Panerai) y usarla como herramienta comercial: puede rozar derechos de marca y de
  diseño industrial, y los modelos de marketplace con marcas suelen tener licencia *editorial*, no comercial.
  Mitigaciones: (1) la esfera sale de **la foto propia de la pieza real** que se vende; (2) no copiar logos en la
  geometría; (3) rotular “maqueta de referencia de tamaño”; (4) consultar a un abogado de propiedad industrial antes
  de modelar formas icónicas en detalle. El prototipo usa una esfera genérica “CLOCK TIME”, sin marcas de terceros.

---

## 3. Restricciones del navegador

| Tema | Detalle |
|---|---|
| **HTTPS** | **[Hecho]** `getUserMedia` solo existe en contexto seguro (HTTPS o `localhost`); en HTTP `navigator.mediaDevices` es `undefined` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)). Para probar desde el teléfono en desarrollo se necesita un túnel HTTPS (p. ej. `cloudflared`) o certificado local. |
| **Permisos** | **[Hecho]** El navegador pide permiso; si se niega, la promesa falla con `NotAllowedError`; sin cámara, `NotFoundError` (MDN). En `iframe` de otro origen hace falta `allow="camera"`. El prototipo traduce ambos errores a mensajes en español. |
| **iOS Safari** | **[Hecho, foro WebKit]** El `<video>` necesita `playsinline` (y `muted`/`autoplay`) para reproducirse en línea ([WebKit bug 220184](https://bugs.webkit.org/show_bug.cgi?id=220184)). **[Estimación]** El permiso puede volver a pedirse en cada visita según los ajustes de Safari. |
| **Peso** | **[Medido]** Página `/probador`: 1,6 KB gzip de JS. Al abrir la cámara: motor (Three + MediaPipe) **696 KB / 179 KB gzip**, WASM **13,5 MB / 3,9 MB gzip**, modelo de mano **7,8 MB** (sin comprimir). ≈ **12 MB** de descarga la primera vez; luego queda en caché. En 4G chileno **[Estimación]** 3–8 s. |
| **Rendimiento gama media** | **[Estimación]** 15–30 fps de detección con delegado GPU en Android de gama media y iPhone recientes; el prototipo cae a CPU si el GPU falla (hay reportes de parpadeo con GPU en algunos equipos: [zenn.dev](https://zenn.dev/tkada/articles/600efba2db186b)). Mejoras: detectar cada 2 cuadros e interpolar, video de 640×480, filtro *One Euro*. **Hay que medir en equipos reales** (p. ej. Samsung A-series, Moto G, iPhone 11). |
| **Privacidad** | **[Hecho por diseño, verificable]** El video se procesa en el dispositivo (WASM + WebGL); el código no envía fotogramas a ningún servidor. Solo se descargan el runtime (desde nuestro dominio) y el modelo (desde `storage.googleapis.com`; en producción conviene servirlo también desde nuestro dominio para no exponer la IP del visitante a Google). |
| **Ley 21.719 (Chile)** | **[Hecho]** Califica los datos biométricos como **sensibles** y entra en vigencia el **1-dic-2026**, con una posible postergación a 2027 en trámite no confirmada ([Diario Constitucional](https://www.diarioconstitucional.cl/2026/06/12/la-ley-21-719-entra-en-vigor-el-1-de-diciembre-y-expone-vacios-en-regulacion-de-pequenas-empresas/), [Ecosistema Startup](https://ecosistemastartup.com/?p=104145)). **[Estimación]** Al no almacenar ni transmitir imágenes ni puntos de la mano, el riesgo es bajo; regla de oro: **nunca** mandar *landmarks* o capturas a analítica. Mantener el aviso de privacidad visible (ya está en el prototipo). |

---

## 4. Recomendación para clocktime.cl

### 4.1 Encaje en Astro

- Página estática `src/pages/probador.astro` (o un modal en la ficha de `Collection.astro`).
- **Isla cliente perezosa sin framework:** un `<script>` de Astro que hace `await import('../lib/probador/engine')`
  **solo al tocar “Abrir cámara”**. Vite separa ese *chunk*; el resto del sitio no carga ni un byte de Three.js ni
  de MediaPipe **[Medido: el `index.html` no referencia el motor]**.
- El runtime WASM se importa con `?url` desde el paquete npm, así que se sirve desde nuestro dominio con versión
  fijada (no depende de un CDN).
- Datos: agregar a `Piece` en `src/data/pieces.ts` un campo opcional, por ejemplo:

  ```ts
  tryon?: {
    shape: 'round' | 'cushion' | 'tonneau';
    caseMm: number; thickMm: number; lugMm: number;
    dial: string;          // recorte de la esfera, p. ej. 'radiomir-slc-dial.webp'
    strap: 'leather-brown' | 'leather-black' | 'rubber-black' | 'steel';
    glb?: string;          // Fase 2: modelo completo opcional
  };
  ```

  y en la ficha un botón “Pruébatelo” → `/probador?pieza=<img>` (el prototipo ya lee ese parámetro).

### 4.2 Fases

| Fase | Qué | Esfuerzo **[Estimación]** | Costo externo |
|---|---|---|---|
| **0 — hecha** | Prototipo `/probador` con reloj genérico escalado al diámetro de la pieza. `noindex`. | — | 0 |
| **1 — MVP público** | Gemelos paramétricos (3 formas de caja), esfera desde foto, correa por pieza, botón en la ficha, modelo de mano servido localmente, filtro One Euro, oclusión de muñeca mejorada (elipse ajustada al ancho detectado), pruebas en 4–6 teléfonos reales, evento de analítica “probador abierto” (sin imágenes). | 7–10 días-persona | 0 |
| **2 — “Ver en 3D / en tu espacio”** | `<model-viewer>` con GLB (exportado del gemelo paramétrico con `GLTFExporter`, o encargado para piezas estrella) + Quick Look/Scene Viewer. | 3–5 días + 0–300 USD por pieza estrella | Bajo |
| **3 — Evaluar SDK** | Solo si la Fase 1 muestra uso alto y conversión: pedir cotización a Perfect Corp y probar DeepAR/Banuba con relojes en web. | 2–3 días de evaluación | Desconocido (cotización) |

### 4.3 Riesgos

1. **Calidad percibida (alto).** En una tienda de lujo, un reloj que “flota” o tiembla resta más de lo que suma.
   Mitigación: presentarlo como **“referencia de tamaño”**, no como foto; publicar solo tras probar en equipos reales.
2. **Precisión de escala (medio).** La escala sale de la proporción de la mano (perspectiva débil) y asume una
   mano adulta media. **[Estimación]** Error de ±10–20 %. Suficiente para comparar 36 vs. 47 mm; no para milímetros.
3. **Seguimiento (medio).** Mangas, relojes ya puestos, poca luz, piel muy oscura o muy clara contra fondo similar,
   y manos de perfil degradan la detección. La extrapolación hacia el antebrazo es la parte más frágil.
4. **Izquierda/derecha (bajo).** Si MediaPipe se equivoca de mano, el reloj aparece del lado de la palma; el
   prototipo tiene un botón **Voltear**.
5. **Peso de descarga (medio).** ≈ 12 MB la primera vez; avisar antes de abrir con datos móviles.
6. **Marcas / diseño industrial (medio).** Ver §2.3.
7. **Dependencia de MediaPipe (bajo).** Apache-2.0 y versión fijada; si Google cambia la API, la versión instalada
   sigue funcionando.

---

## 5. Prototipo incluido en esta rama

**Archivos**

- `src/pages/probador.astro` — página (`noindex`), selector de pieza (lee `pieces.ts`, excluye reservadas), botón
  “Abrir cámara”, controles *Cambiar cámara*, *Voltear*, *Cerrar*, aviso de privacidad, mensajes de error en español.
- `src/lib/probador/engine.ts` — motor: cámara (`getUserMedia`, trasera por defecto), MediaPipe Hand Landmarker
  (GPU con *fallback* a CPU, SIMD/no-SIMD), cálculo de posición/orientación/escala, reloj placeholder en Three.js
  (caja de acero con mapa de entorno, esfera con la **hora actual**, correa de cuero, oclusor invisible de muñeca
  para que la correa “abrace” el brazo), suavizado y limpieza al cerrar o salir de la página.
- `src/layouts/Layout.astro` — nueva prop opcional `noindex`.

**Versiones fijadas** (exactas en `package.json`): `three@0.186.0`, `@types/three@0.186.0`,
`@mediapipe/tasks-vision@1.1.1`, modelo `hand_landmarker/float16/1`.

**Cómo funciona la colocación**

1. Escala px/mm = suma de distancias en imagen entre muñeca, nudillos índice/medio/meñique ÷ las mismas distancias
   en `worldLandmarks` (plano XY, en mm).
2. Ejes: *dedos* = muñeca → nudillo medio; *dorso* = normal de la palma (signo según mano izquierda/derecha);
   la corona (3 h) apunta hacia los dedos y las 12 cruzan la muñeca.
3. Centro del reloj: 32 mm desde el punto de muñeca hacia el codo. Caja del diámetro de la pieza (p. ej. 47 mm).
4. La profundidad (z) del modelo de mano se atenúa a la mitad porque es la coordenada más ruidosa.

**Verificación realizada [Medido]**

- `npm run build` (incluye `astro check`): 0 errores, 0 advertencias.
- Chromium *headless* con cámara simulada a partir de las imágenes de prueba públicas de MediaPipe
  (`right_hands.jpg`, `left_hands.jpg`): el modelo carga, detecta la mano, y con el dorso hacia la cámara el reloj
  aparece con la esfera hacia el espectador y la correa rodeando la muñeca, para mano derecha e izquierda.
  En esa prueba se descubrió y corrigió que, con video sin espejar, la etiqueta de mano de MediaPipe 1.1.1
  corresponde a la mano real.
- **No probado aún en teléfonos reales** (iOS Safari / Android Chrome): es el siguiente paso.

**Probarlo**

```bash
npm install
npm run dev -- --host       # en el computador: http://localhost:4321/probador
# En el teléfono hace falta HTTPS: p. ej. `cloudflared tunnel --url http://localhost:4321`
# y abrir https://<túnel>/probador?pieza=radiomir-slc
```

**Limitaciones conocidas del prototipo**

- Reloj genérico (no el modelo de cada pieza); forma siempre redonda.
- Suavizado exponencial simple (un filtro One Euro reduciría temblor sin agregar retraso).
- Oclusión con una muñeca elíptica de tamaño fijo; no se adapta al grosor real del brazo.
- El modelo de mano se descarga de `storage.googleapis.com`; para producción, copiarlo a `public/models/`.
- No enlazado desde el menú ni desde las fichas (a propósito, hasta probar en equipos reales).

---

## Fuentes

- MediaPipe Hand Landmarker (web): <https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js>
- Snap Lens Studio – Wristwear Try-On: <https://developers.snap.com/lens-studio/features/try-on/wristwear-try-on>
- Foro Snap – Camera Kit Web y wrist tracking: <https://community.snap.com/snapar/discussion/comment/4558>
- WebXR en iOS (2026): <https://born-astro.pages.dev/insights/webxr-standards-2026/>, <https://www.testmuai.com/learning-hub/webxr-compatible-browsers/>, <https://roadtovr.com/?p=170884>
- model-viewer AR: <https://modelviewer.dev/examples/augmentedreality/>, <https://www.github.com/google/model-viewer/issues/4746>
- Scene Viewer: <https://developers.google.com/ar/develop/scene-viewer?hl=pt-br>
- Perfect Corp: <https://perfectcorp.com/business/products/ar-watch>, <https://yce.perfectcorp.com/ai-api/contents/virtual-watch-try-on>, <https://www.perfectcorp.com/business/plan/shopify>, estimación de terceros <https://www.ki-syndikat.de/tools/perfect-corp/>
- DeepAR precios: <https://docs.deepar.ai/deepar-sdk/pricing>
- Banuba: <https://www.banuba.com/e-commerce-virtual-try-on>
- 8th Wall: <https://www.roadtovr.com/niantic-webar-platform-8th-wall-open-source/>, <https://8thwall.org/docs/migration>
- Apple Object Capture (WWDC23): <https://developer.apple.com/videos/play/wwdc2023/10191/>; PhotoRobot: <https://www.photorobot.com/tutorials/object-capture-how-to-make-a-3d-model>
- Costos de modelado (terceros): <https://www.hitem3d.ai/ai-faq/what-is-the-cost-of-a-watch-3d-model-for-freelancers>; Fiverr: <https://fiverr.com/joshmalik1/create-realistic-3d-wrist-watch-modeling-rendering-and-animation>
- getUserMedia: <https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia>; WebKit bug 220184: <https://bugs.webkit.org/show_bug.cgi?id=220184>
- GPU vs CPU en MediaPipe web: <https://zenn.dev/tkada/articles/600efba2db186b>
- Ley 21.719: <https://www.diarioconstitucional.cl/2026/06/12/la-ley-21-719-entra-en-vigor-el-1-de-diciembre-y-expone-vacios-en-regulacion-de-pequenas-empresas/>, <https://ecosistemastartup.com/?p=104145>
