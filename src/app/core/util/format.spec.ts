import { clamp01, formatClock, formatCompact, formatDelta, formatPercent } from './format';

describe('formatCompact', () => {
  it('deja los valores de menos de mil sin sufijo', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(968)).toBe('968');
  });

  it('usa un decimal por debajo de diez unidades y ninguno por encima', () => {
    expect(formatCompact(1_240)).toBe('1.2K');
    expect(formatCompact(48_300)).toBe('48K');
    expect(formatCompact(9_440_000)).toBe('9.4M');
    expect(formatCompact(14_800_000)).toBe('15M');
  });

  it('recorta el decimal cuando es cero', () => {
    expect(formatCompact(2_000)).toBe('2K');
    expect(formatCompact(3_000_000_000)).toBe('3B');
  });

  it('conserva el signo y tolera entradas no finitas', () => {
    expect(formatCompact(-1_500)).toBe('-1.5K');
    expect(formatCompact(Number.NaN)).toBe('—');
    expect(formatCompact(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatClock', () => {
  it('rellena los segundos a dos dígitos', () => {
    expect(formatClock(7)).toBe('0:07');
    expect(formatClock(95)).toBe('1:35');
    expect(formatClock(600)).toBe('10:00');
  });

  it('trunca y protege de valores inválidos', () => {
    expect(formatClock(7.9)).toBe('0:07');
    expect(formatClock(-3)).toBe('0:00');
    expect(formatClock(Number.NaN)).toBe('0:00');
  });
});

describe('formatDelta', () => {
  it('antepone el signo solo en las subidas', () => {
    expect(formatDelta(12.42)).toBe('+12.4%');
    expect(formatDelta(-2.1)).toBe('-2.1%');
    expect(formatDelta(0)).toBe('0.0%');
  });
});

describe('formatPercent', () => {
  it('redondea la proporción y la recorta al rango 0..1', () => {
    expect(formatPercent(0.482)).toBe('48%');
    expect(formatPercent(1.4)).toBe('100%');
    expect(formatPercent(-0.2)).toBe('0%');
  });
});

describe('clamp01', () => {
  it('devuelve cero ante valores no finitos', () => {
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
  });
});
