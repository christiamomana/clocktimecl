const whatsappNumber = '56957595547'; // +56 9 5759 5547
const whatsappMessage = 'Hola, quería más información sobre comprar o vender un reloj. Gracias';

/** Enlace a WhatsApp con un mensaje ya escrito. */
export const whatsappUrl = (text: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

export const site = {
  name: 'Clock Time Chile',
  description:
    'Compra, venta y consignación de relojes de alta gama en Concepción. Pago inmediato, garantía de 3 meses y envíos a todo Chile.',
  instagram: 'https://www.instagram.com/clocktimechile/',
  dm: 'https://ig.me/m/clocktimechile',
  handle: '@clocktimechile',
  whatsapp: whatsappUrl(whatsappMessage),
  whatsappLabel: '+56 9 5759 5547',
};

export const brands = ['Rolex', 'Omega', 'Panerai', 'Tudor', 'TAG Heuer', 'Breitling', 'Cartier', 'Longines', 'Movado'];
