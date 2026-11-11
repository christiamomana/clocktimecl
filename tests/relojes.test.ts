import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askLabel, askMessage } from '../src/lib/relojes.ts';

test('mensaje para consultar precio de un reloj disponible', () => {
  assert.equal(
    askMessage({ estado: 'disponible', marca: 'Panerai', modelo: 'Radiomir S.L.C.', referencia: 'PAM00425', precio: null }),
    'Hola, quería consultar el precio del Panerai Radiomir S.L.C. (ref. PAM00425) que vi en la página. Gracias',
  );
});

test('sin referencia cuando no es un código', () => {
  assert.equal(
    askMessage({ estado: 'disponible', marca: 'Omega', modelo: 'Seamaster Cosmic 2000', referencia: 'Vintage', precio: null }),
    'Hola, quería consultar el precio del Omega Seamaster Cosmic 2000 que vi en la página. Gracias',
  );
});

test('reservado o vendido pide uno similar y no repite la marca', () => {
  assert.equal(
    askMessage({ estado: 'reservado', marca: 'Rolex', modelo: 'Rolex de colección', referencia: 'Oyster Perpetual', precio: null }),
    'Hola, vi el Rolex de colección en la página. ¿Tienen uno similar disponible? Gracias',
  );
});

test('con precio definido, el botón pregunta por disponibilidad y menciona el precio', () => {
  const r = { estado: 'disponible' as const, marca: 'Panerai', modelo: 'Radiomir S.L.C.', referencia: 'PAM00425', precio: 4290000 };
  assert.equal(askLabel(r), 'Consultar disponibilidad');
  assert.match(askMessage(r), /^Hola, me interesa el Panerai Radiomir S\.L\.C\. \(ref\. PAM00425\) que vi en la página a \$\s?4\.290\.000\. ¿Sigue disponible\? Gracias$/);
});

test('sin precio, el botón sigue siendo "Consultar precio"', () => {
  assert.equal(askLabel({ estado: 'disponible', precio: null }), 'Consultar precio');
  assert.equal(askLabel({ estado: 'vendido', precio: 1000 }), 'Buscar una pieza similar');
});
