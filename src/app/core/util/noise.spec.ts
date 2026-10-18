import { hashSeed, seededRandom, seededSeries } from './noise';

describe('ruido determinista', () => {
  it('produce la misma serie para la misma semilla', () => {
    expect(seededSeries('clip-a', 8)).toEqual(seededSeries('clip-a', 8));
  });

  it('produce series distintas para semillas distintas', () => {
    expect(seededSeries('clip-a', 8)).not.toEqual(seededSeries('clip-b', 8));
  });

  it('mantiene las muestras dentro del rango pedido', () => {
    for (const value of seededSeries('clip-a', 64, 0.3)) {
      expect(value).toBeGreaterThanOrEqual(0.3);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('devuelve exactamente la longitud solicitada', () => {
    expect(seededSeries('clip-a', 32)).toHaveLength(32);
    expect(seededSeries('clip-a', 0)).toHaveLength(0);
  });

  it('hashea de forma estable y sin colisión trivial', () => {
    expect(hashSeed('a')).toBe(hashSeed('a'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  it('genera valores en [0, 1)', () => {
    const next = seededRandom('semilla');
    for (let i = 0; i < 100; i++) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
