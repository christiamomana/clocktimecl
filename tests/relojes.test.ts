import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askMessage } from '../src/lib/relojes.ts';

test('mensaje para consultar precio de un reloj disponible', () => {
  assert.equal(
    askMessage({ estado: 'disponible', marca: 'Panerai', modelo: 'Radiomir S.L.C.', referencia: 'PAM00425' }),
    'Hola, quería consultar el precio del Panerai Radiomir S.L.C. (ref. PAM00425) que vi en la página. Gracias',
  );
});

test('sin referencia cuando no es un código', () => {
  assert.equal(
    askMessage({ estado: 'disponible', marca: 'Omega', modelo: 'Seamaster Cosmic 2000', referencia: 'Vintage' }),
    'Hola, quería consultar el precio del Omega Seamaster Cosmic 2000 que vi en la página. Gracias',
  );
});

test('reservado o vendido pide uno similar y no repite la marca', () => {
  assert.equal(
    askMessage({ estado: 'reservado', marca: 'Rolex', modelo: 'Rolex de colección', referencia: 'Oyster Perpetual' }),
    'Hola, vi el Rolex de colección en la página. ¿Tienen uno similar disponible? Gracias',
  );
});
