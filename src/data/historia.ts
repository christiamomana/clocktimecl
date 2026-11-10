// "Nuestra historia", contada por el fundador. El texto es el original; aquí solo se reparte en capítulos.
// Cada bloque es un párrafo ('p'), una frase destacada ('big'), una línea de diálogo ('dialogo')
// o una lista ('lista'). `pausa` marca el párrafo en que el reloj de la página se detiene.

export type Bloque =
  | { tipo: 'p'; texto: string; pausa?: boolean }
  | { tipo: 'big'; texto: string }
  | { tipo: 'dialogo'; quien: 'profesor' | 'niño'; texto: string; final?: boolean }
  | { tipo: 'lista'; intro: string; items: string[]; cierre?: string };

export interface Capitulo {
  numero: string;
  titulo: string;
  /** Cara del reloj que acompaña la lectura: la esfera o el mecanismo. */
  reloj: 'esfera' | 'mecanismo';
  bloques: Bloque[];
}

export const prologo = 'Hay cosas que el tiempo no puede borrar.';

export const capitulos: Capitulo[] = [
  {
    numero: 'I',
    titulo: 'El regalo',
    reloj: 'esfera',
    bloques: [
      {
        tipo: 'p',
        texto:
          'Hay pasiones que no nacen de una decisión, sino de un instante. De esos momentos aparentemente pequeños que, sin saberlo, terminan acompañándonos toda la vida.',
      },
      {
        tipo: 'p',
        texto:
          'La historia de ClockTime Chile comenzó hace muchos años, cuando siendo apenas un niño llegué al colegio llevando en mi muñeca un antiguo reloj enchapado en oro.',
      },
      { tipo: 'big', texto: 'Me lo había pasado mi madre.' },
      {
        tipo: 'p',
        texto:
          'Era una pieza de muchos años, que había pertenecido a alguien profundamente importante en su vida. Un reloj que, mucho antes de llegar a mis manos, ya había sido testigo de una historia que merecía ser recordada.',
      },
    ],
  },
  {
    numero: 'II',
    titulo: 'El salón de clases',
    reloj: 'esfera',
    bloques: [
      { tipo: 'p', texto: 'Aquel día, un profesor observó mi muñeca y me preguntó:' },
      { tipo: 'dialogo', quien: 'profesor', texto: '¿Qué llevas ahí?' },
      { tipo: 'p', texto: 'Con la inocencia propia de un niño, respondí:' },
      { tipo: 'dialogo', quien: 'niño', texto: 'Un reloj, profesor.' },
      { tipo: 'p', texto: 'Entonces pronunció unas palabras que nunca olvidaría:' },
      { tipo: 'dialogo', quien: 'profesor', texto: 'No. Lo que tú llevas ahí es arte.', final: true },
      {
        tipo: 'p',
        texto: 'Aquella frase quedó suspendida en mi memoria, como si el tiempo hubiese decidido detenerse por un instante.',
        pausa: true,
      },
    ],
  },
  {
    numero: 'III',
    titulo: 'Detrás de la esfera',
    reloj: 'mecanismo',
    bloques: [
      { tipo: 'p', texto: 'Pasaron los años y comprendí su verdadero significado.' },
      {
        tipo: 'big',
        texto:
          'Descubrí que detrás de una esfera, de unas agujas y de cientos de pequeños engranajes, existe algo extraordinario: el talento humano intentando darle forma al tiempo.',
      },
    ],
  },
  {
    numero: 'IV',
    titulo: 'Los relojes guardan historias',
    reloj: 'esfera',
    bloques: [
      { tipo: 'big', texto: 'Comprendí también que los relojes no solamente cuentan las horas. Guardan historias.' },
      {
        tipo: 'p',
        texto:
          'Historias de quienes los eligieron, de quienes los regalaron, de quienes los llevaron durante décadas y de quienes algún día decidieron entregarlos a otras manos.',
      },
      {
        tipo: 'lista',
        intro: 'Un reloj puede representar',
        items: [
          'el esfuerzo de toda una vida,',
          'el recuerdo de alguien querido,',
          'la celebración de un logro',
          'o simplemente la satisfacción de poseer una extraordinaria obra de relojería.',
        ],
      },
    ],
  },
  {
    numero: 'V',
    titulo: 'Nace ClockTime Chile',
    reloj: 'esfera',
    bloques: [
      {
        tipo: 'p',
        texto: 'Y fue precisamente esa manera de entenderlos la que, muchos años después, dio origen a ClockTime Chile.',
      },
      {
        tipo: 'lista',
        intro:
          'Un proyecto nacido de la pasión por la alta relojería, que busca unir el valor de estas extraordinarias piezas con una forma de hacer negocios basada en',
        items: ['la confianza,', 'la transparencia,', 'la autenticidad', 'y el respeto por su historia.'],
      },
      {
        tipo: 'p',
        texto:
          'Porque para nosotros comprar, vender o entregar un reloj en consignación no significa únicamente establecer un precio.',
      },
      {
        tipo: 'big',
        texto: 'Significa reconocer su pasado, comprender su valor y encontrar a alguien que desee continuar su historia.',
      },
      {
        tipo: 'p',
        texto:
          'Desde Concepción, y con una mirada puesta en todo Chile, queremos construir un espacio donde cada reloj sea apreciado no solamente por su marca, su calibre o su valor comercial, sino también por aquello que representa para quien lo ha llevado.',
      },
    ],
  },
  {
    numero: 'VI',
    titulo: 'El tiempo que ha vivido',
    reloj: 'esfera',
    bloques: [
      { tipo: 'big', texto: 'Creemos que un reloj puede cambiar de dueño, pero jamás pierde el tiempo que ha vivido.' },
      {
        tipo: 'p',
        texto:
          'Hoy, cuando observo una pieza de alta relojería, inevitablemente regreso a aquel salón de clases, a ese antiguo reloj de oro, al regalo de mi madre y a las palabras de un profesor que me enseñó a mirar más allá de las agujas.',
      },
      { tipo: 'p', texto: 'Quizás allí comenzó todo.' },
      { tipo: 'p', texto: 'Porque sin saberlo, aquel día no solamente descubrí una pasión.' },
      { tipo: 'big', texto: 'Descubrí una manera de entender el tiempo.' },
      { tipo: 'p', texto: 'Y esa manera de entenderlo es, precisamente, lo que hoy queremos compartir contigo.' },
    ],
  },
];

export const cierre = {
  marca: 'CLOCKTIME CHILE',
  lema: 'No vendemos solamente relojes. Damos continuidad a sus historias.',
  final: ['Porque el tiempo pasa.', 'El arte permanece.', 'Y las historias merecen continuar.'],
};
