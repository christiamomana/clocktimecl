// Inventario del catálogo. Reemplaza estas fichas por las piezas reales de la tienda:
// nombra marca, colección, referencia, calibre y diámetro con exactitud (nunca inventes datos técnicos).
// `image` es opcional: una ruta en /public (p. ej. '/relojes/pam00425.jpg'). Sin imagen se muestra una esfera ilustrada.

export type WatchStatus = 'disponible' | 'vendido';

export interface Watch {
  brand: string;
  model: string;
  reference: string;
  specs: string[];
  includes: string[];
  /** Precio en CLP. `null` = "Consultar · Precio por DM". */
  price: number | null;
  status: WatchStatus;
  image?: string;
}

const fullSet = ['Caja y documentación original', 'Garantía 3 meses', 'Pago con tarjeta de crédito hasta 12 cuotas'];

export const watches: Watch[] = [
  {
    brand: 'Panerai',
    model: 'Radiomir S.L.C.',
    reference: 'PAM00425',
    specs: ['Calibre P.3000 cuerda manual', 'Diámetro 47 mm', 'Cristal zafiro'],
    includes: fullSet,
    price: null,
    status: 'disponible',
  },
  {
    brand: 'Rolex',
    model: 'Submariner Date',
    reference: '126610LN',
    specs: ['Calibre 3235 automático', 'Diámetro 41 mm', 'Cristal zafiro'],
    includes: fullSet,
    price: null,
    status: 'disponible',
  },
  {
    brand: 'Omega',
    model: 'Speedmaster Moonwatch',
    reference: '310.30.42.50.01.001',
    specs: ['Calibre 3861 cuerda manual', 'Diámetro 42 mm', 'Cristal hesalita'],
    includes: fullSet,
    price: null,
    status: 'disponible',
  },
  {
    brand: 'Tudor',
    model: 'Black Bay Fifty-Eight',
    reference: '79030N',
    specs: ['Calibre MT5402 automático', 'Diámetro 39 mm', 'Cristal zafiro'],
    includes: fullSet,
    price: null,
    status: 'vendido',
  },
];

export const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
