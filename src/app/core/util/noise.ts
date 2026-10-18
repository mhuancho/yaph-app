/**
 * Ruido determinista a partir de una semilla de texto.
 *
 * Se usa para las alturas de barras del visualizador y para las series de los
 * sparklines: con `Math.random()` el valor cambiaría en cada render (y en cada
 * test), y con datos fijos escritos a mano el código quedaría ilegible.
 */

/** Hash FNV-1a de 32 bits. */
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** PRNG mulberry32: rápido, sin dependencias y reproducible. */
export function seededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Serie normalizada (0..1) de `length` muestras, estable para la misma semilla. */
export function seededSeries(seed: string, length: number, floor = 0.18): number[] {
  const next = seededRandom(seed);
  return Array.from({ length }, () => floor + next() * (1 - floor));
}
