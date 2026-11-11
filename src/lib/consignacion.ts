// Consignación: ClockTime Chile cobra el 10 % del precio final de venta, solo si la venta se concreta.
// Para que el propietario reciba un monto líquido L, el precio de venta es P = L / (1 − 10 %).

export const COMISION = 0.1;

export interface CalculoConsignacion {
  liquido: number;
  precioVenta: number;
  comision: number;
}

export function calcularConsignacion(liquido: number): CalculoConsignacion {
  const l = Math.max(0, Math.round(liquido));
  const precioVenta = Math.round(l / (1 - COMISION));
  return { liquido: l, precioVenta, comision: precioVenta - l };
}

/** Lee montos escritos como "2.000.000", "$2000000" o "2 000 000". */
export const parseMonto = (texto: string): number => Number(texto.replace(/[^\d]/g, '')) || 0;
