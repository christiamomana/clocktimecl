export const site = {
  name: 'Clock Time Chile',
  tagline: 'Más que relojes, confianza.',
  signature: 'El tiempo también inspira.',
  description:
    'Compra, venta y consignación de relojes de alta gama en Concepción, con envíos a todo Chile. Tasación profesional, pago inmediato y venta con garantía.',
  location: 'Concepción',
  coverage: 'Todo Chile',
  instagram: {
    handle: '@clocktimechile',
    url: 'https://www.instagram.com/clocktimechile/',
    dm: 'https://ig.me/m/clocktimechile',
  },
} as const;

export const nav = [
  { href: '#catalogo', label: 'Catálogo' },
  { href: '#vender', label: 'Vende tu reloj' },
  { href: '#consignacion', label: 'Consignación' },
  { href: '#preguntas', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
] as const;

export const brands = [
  'Rolex',
  'Omega',
  'Tudor',
  'TAG Heuer',
  'Breitling',
  'Cartier',
  'Panerai',
  'Longines',
] as const;
