const whatsappNumber = '56957595547'; // +56 9 5759 5547
/** Link de WhatsApp a la tienda con un mensaje ya escrito. */
export const whatsappLink = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const whatsappMessage = 'Hola, ¿cómo están? Quería cachar más de los relojes que están vendiendo. ¿Me pueden contar qué tienen disponible?';

export const site = {
  name: 'Clock Time Chile',
  description:
    'Compra, venta y consignación de relojes de alta gama en Concepción. Pago inmediato, garantía de 3 meses y envíos a todo Chile.',
  instagram: 'https://www.instagram.com/clocktimechile/',
  dm: 'https://ig.me/m/clocktimechile',
  handle: '@clocktimechile',
  whatsapp: whatsappLink(whatsappMessage),
  whatsappLabel: '+56 9 5759 5547',
};

export const brands = ['Rolex', 'Omega', 'Panerai', 'Tudor', 'TAG Heuer', 'Breitling', 'Cartier', 'Longines', 'Movado'];
