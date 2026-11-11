import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularConsignacion, parseMonto } from '../src/lib/consignacion.ts';

test('el ejemplo del servicio: $2.000.000 líquidos', () => {
  assert.deepEqual(calcularConsignacion(2_000_000), { liquido: 2_000_000, precioVenta: 2_222_222, comision: 222_222 });
});

test('la comisión es el 10 % del precio de venta', () => {
  const { precioVenta, comision, liquido } = calcularConsignacion(4_500_000);
  assert.equal(precioVenta, 5_000_000);
  assert.equal(comision, 500_000);
  assert.equal(precioVenta - comision, liquido);
});

test('montos escritos de distintas formas', () => {
  assert.equal(parseMonto('$2.000.000'), 2_000_000);
  assert.equal(parseMonto('2 000 000'), 2_000_000);
  assert.equal(parseMonto(''), 0);
});
