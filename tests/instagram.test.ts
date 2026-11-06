import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFicha, detectEstado, looksLikeFicha, smartCase } from '../src/lib/instagram.ts';

const ficha = `⌚ PANERAI RADIOMIR S.L.C. – PAM00425

Su emblemática caja de acero de 47 mm alberga una elegante esfera negra.
A las seis, el emblema Siluro a Lenta Corsa.

¿Lo incorporarías a tu colección?

▪️ PANERAI RADIOMIR S.L.C.
▪️ Calibre P.3000 cuerda manual
▪️ Referencia PAM00425
▪️ Diámetro 47 mm
▪️ Cristal zafiro

✔️ Reloj
✔️ Caja original
✔️ Documentación original
✔️ Garantía 3 meses
✔️ Pago con tarjeta crédito

Tus consultas y precios por DM 📩
#panerai #relojes #concepcion`;

test('lee marca, modelo, referencia y medida', () => {
  const { data, avisos } = parseFicha(ficha, 'https://www.instagram.com/p/ABC/');
  assert.equal(data.marca, 'Panerai');
  assert.equal(data.modelo, 'Radiomir S.L.C.');
  assert.equal(data.referencia, 'PAM00425');
  assert.equal(data.medida, '47 mm');
  assert.equal(data.estado, 'disponible');
  assert.equal(data.publicado, false);
  assert.equal(data.instagram_url, 'https://www.instagram.com/p/ABC/');
  assert.deepEqual(avisos, []);
});

test('separa especificaciones (sin repetir el título) e inclusiones', () => {
  const { data } = parseFicha(ficha);
  assert.deepEqual(data.especificaciones, [
    { nombre: 'Calibre', valor: 'P.3000 cuerda manual' },
    { nombre: 'Referencia', valor: 'PAM00425' },
    { nombre: 'Diámetro', valor: '47 mm' },
    { nombre: 'Cristal', valor: 'zafiro' },
  ]);
  assert.deepEqual(data.incluye, ['Reloj', 'Caja original', 'Documentación original', 'Garantía 3 meses', 'Pago con tarjeta crédito']);
});

test('la descripción no incluye la pregunta de cierre ni el DM ni hashtags', () => {
  const { data } = parseFicha(ficha);
  assert.match(data.descripcion, /^Su emblemática caja/);
  assert.match(data.descripcion, /¿Lo incorporarías a tu colección\?/);
  assert.doesNotMatch(data.descripcion, /DM|#panerai/);
});

test('marcas de varias palabras', () => {
  const { data } = parseFicha('⌚ TAG HEUER FORMULA 1 CHRONOGRAPH – CAZ1010.FT8024\n▪️ Diámetro 43 mm\n▪️ Cristal zafiro');
  assert.equal(data.marca, 'TAG Heuer');
  assert.equal(data.modelo, 'Formula 1 Chronograph');
  assert.equal(data.referencia, 'CAZ1010.FT8024');
});

test('estado desde el texto', () => {
  assert.equal(detectEstado('VENDIDO. Este reloj ya encontró un nuevo dueño.'), 'vendido');
  assert.equal(detectEstado('⛔️ No disponible'), 'vendido');
  assert.equal(detectEstado('RESERVADO 🟢'), 'reservado');
  assert.equal(detectEstado('Disponible 🟢'), 'disponible');
});

test('reconoce fichas y descarta promos', () => {
  assert.equal(looksLikeFicha(ficha), true);
  assert.equal(looksLikeFicha('COMPRAMOS TU RELOJ · PAGO INMEDIATO'), false);
});

test('avisa lo que falta', () => {
  const { avisos } = parseFicha('Un reloj precioso sin ficha');
  assert.ok(avisos.length >= 2);
});

test('smartCase', () => {
  assert.equal(smartCase('MASTER COLLECTION MOONPHASE'), 'Master Collection Moonphase');
  assert.equal(smartCase('Radiomir GMT oro rojo'), 'Radiomir GMT oro rojo');
});
