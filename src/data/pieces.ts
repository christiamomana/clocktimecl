// Piezas de la vitrina. Para agregar una, sube sus fotos a /public/img y regístralas en src/lib/pic.ts.

/**
 * Gemelo paramétrico para el probador virtual (/probador): no es un modelo 3D escaneado, sino una caja
 * genérica con las medidas de la pieza y la esfera recortada de su propia foto.
 * Las medidas son aproximadas (referencia de la marca); verifica con pie de metro antes de publicar.
 * Para calibrar el recorte de la esfera usa /probador/calibrar.
 */
export interface TryOn {
  /** round = redonda · cushion = cojín (Panerai Radiomir) · tonneau = caja integrada/barril. */
  shape: 'round' | 'cushion' | 'tonneau';
  /** Diámetro o ancho de la caja, sin corona (mm). */
  caseMm: number;
  /** Grosor total (mm). */
  thickMm: number;
  /** Ancho entre asas = ancho de la correa (mm). */
  lugMm: number;
  metal: 'steel' | 'rose-gold' | 'yellow-gold';
  strap: 'leather-tan' | 'leather-brown' | 'leather-black' | 'leather-navy' | 'rubber-black' | 'bracelet-steel';
  /**
   * Recorte de la esfera en la foto. x, y = centro (fracción del ancho y alto de la foto);
   * r = radio (fracción del ancho); sy = alto/ancho de la elipse si la foto está en ángulo (1 = de frente);
   * rot = giro en grados; face = qué fracción del diámetro de la caja cubre la esfera (incluye bisel si se recortó).
   */
  dial: { src: string; x: number; y: number; r: number; sy?: number; rot?: number; face?: number };
}

export interface Piece {
  brand: string;
  name: string;
  ref: string;
  size: string;
  img: string;
  pos?: string;
  tag?: string;
  reserved?: boolean;
  desc: string;
  specs: [string, string][];
  incl: string[];
  tryon?: TryOn;
}

export const pieces: Piece[] = [
  {
    brand: 'Panerai', name: 'Radiomir S.L.C.', ref: 'PAM00425', size: '47 mm', img: 'radiomir-slc', pos: '50% 45%',
    desc: 'Caja de acero en forma de cojín, esfera negra minimalista y agujas doradas. A las seis, el emblema Siluro a Lenta Corsa que buscan los coleccionistas.',
    specs: [['Referencia', 'PAM00425'], ['Calibre', 'P.3000, cuerda manual'], ['Reserva de marcha', '72 horas'], ['Diámetro', '47 mm']],
    incl: ['Reloj', 'Caja original', 'Documentación', 'Garantía 3 meses'],
    tryon: {
      shape: 'cushion', caseMm: 47, thickMm: 15.5, lugMm: 26, metal: 'steel', strap: 'leather-tan',
      dial: { src: '/img/radiomir-slc-1100.webp', x: 0.505, y: 0.463, r: 0.18, face: 0.84 },
    },
  },
  {
    brand: 'Panerai', name: 'Radiomir GMT oro rojo', ref: 'PAM00598', size: '47 mm', tag: 'Edición de 200', img: 'radiomir-gmt', pos: '48% 40%',
    desc: 'Edición limitada a 200 ejemplares, presentada en 2014. Caja de 47 mm en oro rojo de 18 quilates y una espectacular esfera azul soleil.',
    specs: [['Referencia', 'PAM00598'], ['Calibre', 'P.3001/10, esqueletizado'], ['Funciones', 'GMT, reserva 72 h'], ['Material', 'Oro rojo 18 k']],
    incl: ['Reloj', 'Caja original', 'Documentación', 'Garantía 3 meses'],
    tryon: {
      shape: 'cushion', caseMm: 47, thickMm: 15.5, lugMm: 26, metal: 'rose-gold', strap: 'leather-brown',
      dial: { src: '/img/radiomir-gmt-1100.webp', x: 0.426, y: 0.329, r: 0.095, sy: 0.92, face: 0.84 },
    },
  },
  {
    brand: 'Longines', name: 'Master Collection Moonphase', ref: 'Master Collection', size: 'Acero', img: 'longines-moonphase', pos: '50% 35%',
    desc: 'Esfera plateada, números arábigos y agujas azuladas: cronógrafo, calendario completo, indicación de 24 horas y fases lunares a las seis.',
    specs: [['Colección', 'Master Collection'], ['Movimiento', 'Automático'], ['Funciones', 'Cronógrafo, fases lunares'], ['Esfera', 'Plateada']],
    incl: ['Reloj', 'Caja original', 'Garantía internacional', 'Garantía 3 meses'],
    tryon: {
      // La ficha no indica diámetro: 40 mm es la medida habitual de este cronógrafo; confirmar.
      shape: 'round', caseMm: 40, thickMm: 14.5, lugMm: 20, metal: 'steel', strap: 'leather-black',
      dial: { src: '/img/longines-moonphase-1100.webp', x: 0.463, y: 0.479, r: 0.112, face: 0.88 },
    },
  },
  {
    brand: 'TAG Heuer', name: 'Formula 1 Chronograph', ref: 'CAZ1010.FT8024', size: '43 mm', img: 'tag-formula1', pos: '50% 40%',
    desc: 'El espíritu del automovilismo suizo: esfera negra con tres subesferas, bisel taquimétrico, caja de acero y correa de caucho perforada.',
    specs: [['Referencia', 'CAZ1010.FT8024'], ['Movimiento', 'Cuarzo suizo, cronógrafo'], ['Diámetro', '43 mm'], ['Cristal', 'Zafiro']],
    incl: ['Reloj', 'Estuche', 'Garantía 3 meses'],
    tryon: {
      shape: 'round', caseMm: 43, thickMm: 12, lugMm: 22, metal: 'steel', strap: 'rubber-black',
      dial: { src: '/img/tag-formula1-1100.webp', x: 0.515, y: 0.53, r: 0.22, sy: 0.94, face: 0.96 },
    },
  },
  {
    brand: 'Omega', name: 'Seamaster Cosmic 2000', ref: 'Vintage', size: '41 mm', img: 'omega-cosmic', pos: '50% 50%',
    desc: 'Un diseño fuera de lo convencional, de caja integrada y bisel giratorio. De los Omega más interesantes y menos conocidos.',
    specs: [['Colección', 'Seamaster'], ['Movimiento', 'Automático'], ['Diámetro', '41 mm'], ['Época', 'Vintage']],
    incl: ['Reloj', 'Garantía 3 meses'],
    tryon: {
      shape: 'tonneau', caseMm: 41, thickMm: 13, lugMm: 20, metal: 'steel', strap: 'bracelet-steel',
      dial: { src: '/img/omega-cosmic-720.webp', x: 0.52, y: 0.345, r: 0.38, sy: 0.88, face: 0.9 },
    },
  },
  {
    brand: 'Movado', name: 'Automatic años 50', ref: 'Bumper automático', size: '36 mm', img: 'movado-50s', pos: '50% 45%',
    desc: 'Caja de oro de 36 mm y el ingenioso movimiento automático de martillo, que daba cuerda rebotando sobre pequeños resortes antes de los rotores de 360°.',
    specs: [['Época', 'Años 50'], ['Movimiento', 'Automático de martillo'], ['Caja', 'Oro, 36 mm'], ['Origen', 'Suiza']],
    incl: ['Reloj', 'Garantía 3 meses'],
    tryon: {
      shape: 'round', caseMm: 36, thickMm: 10, lugMm: 18, metal: 'yellow-gold', strap: 'leather-navy',
      dial: { src: '/img/movado-50s-720.webp', x: 0.485, y: 0.495, r: 0.3, sy: 0.5, rot: -4, face: 0.9 },
    },
  },
  {
    brand: 'Rolex', name: 'Rolex de colección', ref: 'Oyster Perpetual', size: 'Acero y oro', img: 'rolex-reservado', pos: '50% 72%', reserved: true,
    desc: 'Esta pieza ya está por llegar a un nuevo dueño. Si buscas un Rolex similar, escríbenos y lo buscamos por ti.',
    specs: [['Marca', 'Rolex'], ['Caja', 'Acero y oro'], ['Correa', 'Cuero'], ['Estado', 'Reservado']],
    incl: ['Reservado'],
  },
];
