/**
 * Formateo determinista para las métricas del HUD.
 *
 * No se usa `Intl.NumberFormat(..., { notation: 'compact' })` a propósito: su
 * salida depende del locale ("1,2 mil" en es-ES) y del dato CLDR del runtime,
 * lo que rompe el ancho fijo de la tipografía monoespaciada y hace los tests
 * dependientes del entorno.
 */

const UNITS = [
  { limit: 1e9, suffix: 'B' },
  { limit: 1e6, suffix: 'M' },
  { limit: 1e3, suffix: 'K' },
] as const;

/** 968 → "968" · 1240 → "1.2K" · 48_300_000 → "48.3M" */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  for (const { limit, suffix } of UNITS) {
    if (abs >= limit) {
      const scaled = abs / limit;
      // Un decimal por debajo de 10 ("9.4K"), ninguno por encima ("48K").
      const text = scaled < 10 ? trimZero(scaled.toFixed(1)) : Math.round(scaled).toString();
      return `${sign}${text}${suffix}`;
    }
  }
  return `${sign}${Math.round(abs)}`;
}

/** 7 → "0:07" · 95 → "1:35" */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** 12.42 → "+12.4%" · -3 → "-3.0%" */
export function formatDelta(percent: number): string {
  if (!Number.isFinite(percent)) return '—';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

/** 0.482 → "48%" */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '—';
  return `${Math.round(clamp01(ratio) * 100)}%`;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function trimZero(text: string): string {
  return text.endsWith('.0') ? text.slice(0, -2) : text;
}
