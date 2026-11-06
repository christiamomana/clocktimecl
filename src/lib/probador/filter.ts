// Filtro One Euro (Casiez, Roussel y Vogel, CHI 2012): suaviza mucho cuando la mano está quieta
// (menos temblor) y poco cuando se mueve rápido (menos retraso). https://gery.casiez.net/1euro/

const alpha = (cutoff: number, dt: number) => {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
};

export class OneEuro {
  private x: number | null = null;
  private dx = 0;
  private t = 0;

  /**
   * @param minCutoff Hz; más bajo = más suave en reposo.
   * @param beta cuánto sube el corte con la velocidad; más alto = menos retraso al moverse.
   */
  constructor(private minCutoff = 1.2, private beta = 0.02, private dCutoff = 1) {}

  reset(): void {
    this.x = null;
  }

  /** @param t tiempo en segundos */
  filter(value: number, t: number): number {
    if (this.x === null) {
      this.x = value;
      this.dx = 0;
      this.t = t;
      return value;
    }
    const dt = Math.max(1e-3, t - this.t);
    this.t = t;
    const rawDx = (value - this.x) / dt;
    this.dx += alpha(this.dCutoff, dt) * (rawDx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }
}

/** Varios canales con los mismos parámetros (p. ej. x, y de un punto). */
export class OneEuroN {
  private fs: OneEuro[];
  constructor(n: number, minCutoff?: number, beta?: number) {
    this.fs = Array.from({ length: n }, () => new OneEuro(minCutoff, beta));
  }
  reset(): void {
    this.fs.forEach((f) => f.reset());
  }
  filter(values: number[], t: number): number[] {
    return values.map((v, i) => this.fs[i].filter(v, t));
  }
}
