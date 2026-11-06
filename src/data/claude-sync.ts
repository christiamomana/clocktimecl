// Instrucciones para que Claude (extensión Claude in Chrome, con tu sesión de Instagram y del admin abiertas)
// compare Instagram con la vitrina y suba lo que falte. Se muestran en /admin/importar para copiarlas.
export const claudeSyncPrompt = (adminOrigin: string) => `Sincroniza la vitrina de Clock Time Chile con Instagram.

1. Abre ${adminOrigin}/admin/importar y anota los links de "Ya importadas".
2. Abre https://www.instagram.com/clocktimechile/ y revisa las últimas 24 publicaciones.
3. Considera solo las publicaciones que son ficha de un reloj: su texto tiene una línea con ⌚ o varias líneas con ▪️. Ignora promos, efemérides y avisos de servicios.
4. Para cada ficha cuyo link (instagram.com/p/…) NO esté en "Ya importadas":
   a. Abre la publicación y copia el texto completo, tal cual.
   b. Copia las URLs de todas sus fotos (en un carrusel, avanza por cada foto). Usa la imagen grande de la publicación, no miniaturas.
   c. En ${adminOrigin}/admin/importar pega el link, el texto y las URLs de las fotos (una por línea) y pulsa "Importar como borrador".
   d. Si aparece "Esa publicación ya está importada", sigue con la siguiente.
5. No publiques nada: los relojes quedan como borrador para que yo los revise.
6. Revisa además en ${adminOrigin}/admin si algún reloj publicado aparece en Instagram como VENDIDO o RESERVADO y su estado no coincide; no lo cambies, solo avísame.
7. Al terminar, dame un resumen: cuántas fichas revisaste, cuáles importaste (marca y modelo), cuáles fallaron y por qué, y los estados que no coinciden.`;
