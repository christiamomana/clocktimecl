import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askMessage } from '../src/lib/relojes.ts';

const base = { marca: 'Panerai', modelo: 'Radiomir S.L.C.', referencia: 'PAM00425', medida: '47 mm' };

test('askMessage consulta el precio de una pieza disponible con su referencia y medida', () => {
  assert.equal(
    askMessage({ ...base, estado: 'disponible' }),
    'Hola, ¿cómo están? Quería consultar el precio del Panerai Radiomir S.L.C. (ref. PAM00425, 47 mm) que vi en su sitio web. ¿Sigue disponible?',
  );
});

test('askMessage omite referencia y medida cuando faltan', () => {
  assert.match(askMessage({ ...base, referencia: '', medida: '', estado: 'disponible' }), /precio del Panerai Radiomir S\.L\.C\. que vi/);
});

test('askMessage pide una pieza similar si está reservada o vendida', () => {
  assert.match(askMessage({ ...base, estado: 'reservado' }), /aparece como reservado\. ¿Me pueden ayudar a buscar una pieza similar\?$/);
  assert.match(askMessage({ ...base, estado: 'vendido' }), /aparece como vendido\./);
});

test('askMessage ignora referencias y medidas sin números y no repite la marca', () => {
  assert.match(
    askMessage({ marca: 'Omega', modelo: 'Seamaster Cosmic 2000', referencia: 'Vintage', medida: '41 mm', estado: 'disponible' }),
    /precio del Omega Seamaster Cosmic 2000 \(41 mm\) que vi/,
  );
  assert.match(
    askMessage({ marca: 'Rolex', modelo: 'Rolex de colección', referencia: 'Oyster Perpetual', medida: 'Acero y oro', estado: 'reservado' }),
    /^Hola, ¿cómo están\? Vi el Rolex de colección en su sitio web/,
  );
});
