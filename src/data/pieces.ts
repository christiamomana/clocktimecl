// Piezas de la vitrina. Para agregar una, sube sus fotos a /public/img y regístralas en src/lib/pic.ts.

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
}

export const pieces: Piece[] = [
  {
    brand: 'Panerai', name: 'Radiomir S.L.C.', ref: 'PAM00425', size: '47 mm', img: 'radiomir-slc', pos: '50% 45%',
    desc: 'Caja de acero en forma de cojín, esfera negra minimalista y agujas doradas. A las seis, el emblema Siluro a Lenta Corsa que buscan los coleccionistas.',
    specs: [['Referencia', 'PAM00425'], ['Calibre', 'P.3000, cuerda manual'], ['Reserva de marcha', '72 horas'], ['Diámetro', '47 mm']],
    incl: ['Reloj', 'Caja original', 'Documentación', 'Garantía 3 meses'],
  },
  {
    brand: 'Panerai', name: 'Radiomir GMT oro rojo', ref: 'PAM00598', size: '47 mm', tag: 'Edición de 200', img: 'radiomir-gmt', pos: '48% 40%',
    desc: 'Edición limitada a 200 ejemplares, presentada en 2014. Caja de 47 mm en oro rojo de 18 quilates y una espectacular esfera azul soleil.',
    specs: [['Referencia', 'PAM00598'], ['Calibre', 'P.3001/10, esqueletizado'], ['Funciones', 'GMT, reserva 72 h'], ['Material', 'Oro rojo 18 k']],
    incl: ['Reloj', 'Caja original', 'Documentación', 'Garantía 3 meses'],
  },
  {
    brand: 'Longines', name: 'Master Collection Moonphase', ref: 'Master Collection', size: 'Acero', img: 'longines-moonphase', pos: '50% 35%',
    desc: 'Esfera plateada, números arábigos y agujas azuladas: cronógrafo, calendario completo, indicación de 24 horas y fases lunares a las seis.',
    specs: [['Colección', 'Master Collection'], ['Movimiento', 'Automático'], ['Funciones', 'Cronógrafo, fases lunares'], ['Esfera', 'Plateada']],
    incl: ['Reloj', 'Caja original', 'Garantía internacional', 'Garantía 3 meses'],
  },
  {
    brand: 'TAG Heuer', name: 'Formula 1 Chronograph', ref: 'CAZ1010.FT8024', size: '43 mm', img: 'tag-formula1', pos: '50% 40%',
    desc: 'El espíritu del automovilismo suizo: esfera negra con tres subesferas, bisel taquimétrico, caja de acero y correa de caucho perforada.',
    specs: [['Referencia', 'CAZ1010.FT8024'], ['Movimiento', 'Cuarzo suizo, cronógrafo'], ['Diámetro', '43 mm'], ['Cristal', 'Zafiro']],
    incl: ['Reloj', 'Estuche', 'Garantía 3 meses'],
  },
  {
    brand: 'Omega', name: 'Seamaster Cosmic 2000', ref: 'Vintage', size: '41 mm', img: 'omega-cosmic', pos: '50% 50%',
    desc: 'Un diseño fuera de lo convencional, de caja integrada y bisel giratorio. De los Omega más interesantes y menos conocidos.',
    specs: [['Colección', 'Seamaster'], ['Movimiento', 'Automático'], ['Diámetro', '41 mm'], ['Época', 'Vintage']],
    incl: ['Reloj', 'Garantía 3 meses'],
  },
  {
    brand: 'Movado', name: 'Automatic años 50', ref: 'Bumper automático', size: '36 mm', img: 'movado-50s', pos: '50% 45%',
    desc: 'Caja de oro de 36 mm y el ingenioso movimiento automático de martillo, que daba cuerda rebotando sobre pequeños resortes antes de los rotores de 360°.',
    specs: [['Época', 'Años 50'], ['Movimiento', 'Automático de martillo'], ['Caja', 'Oro, 36 mm'], ['Origen', 'Suiza']],
    incl: ['Reloj', 'Garantía 3 meses'],
  },
  {
    brand: 'Rolex', name: 'Rolex de colección', ref: 'Oyster Perpetual', size: 'Acero y oro', img: 'rolex-reservado', pos: '50% 72%', reserved: true,
    desc: 'Esta pieza ya está por llegar a un nuevo dueño. Si buscas un Rolex similar, escríbenos y lo buscamos por ti.',
    specs: [['Marca', 'Rolex'], ['Caja', 'Acero y oro'], ['Correa', 'Cuero'], ['Estado', 'Reservado']],
    incl: ['Reservado'],
  },
];
