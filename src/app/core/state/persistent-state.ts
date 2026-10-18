import { Service, signal, WritableSignal } from '@angular/core';

const NAMESPACE = 'yaph:v1:';

/**
 * Estado que sobrevive a una recarga.
 *
 * Cada lectura y cada escritura van en `try/catch`: `localStorage` lanza en
 * navegación privada, con las cookies bloqueadas y al llenarse la cuota, y un
 * fallo al guardar un «me gusta» no puede tumbar la aplicación. Cuando no está
 * disponible, los signals siguen funcionando en memoria.
 *
 * No guarda datos de catálogo, solo lo que el usuario ha hecho: con un backend
 * real esto sería caché de UI, nunca la fuente de verdad.
 */
@Service()
export class PersistentState {
  private readonly storage = readStorage();

  readonly available = this.storage !== null;

  read<T>(key: string, fallback: T): T {
    if (!this.storage) return fallback;

    try {
      const raw = this.storage.getItem(NAMESPACE + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      // JSON corrupto o acceso denegado: se sigue con el valor por defecto.
      return fallback;
    }
  }

  write(key: string, value: unknown): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(NAMESPACE + key, JSON.stringify(value));
    } catch {
      // Cuota llena o almacenamiento bloqueado: no es motivo para romper nada.
    }
  }

  remove(key: string): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(NAMESPACE + key);
    } catch {
      /* ignorado a propósito */
    }
  }

  /** Borra solo lo de esta aplicación, no el resto del dominio. */
  clear(): void {
    if (!this.storage) return;

    try {
      const keys = Object.keys(this.storage).filter((key) => key.startsWith(NAMESPACE));
      for (const key of keys) this.storage.removeItem(key);
    } catch {
      /* ignorado a propósito */
    }
  }

  /**
   * Signal hidratado desde el almacenamiento que se guarda al escribirlo.
   *
   * La escritura es síncrona, dentro de `set`/`update`, y no en un `effect`:
   * un efecto corre en el siguiente ciclo de detección de cambios, así que un
   * «me gusta» dado justo antes de cerrar la pestaña podría no llegar a
   * guardarse. Además así no hace falta contexto de inyección.
   */
  signal<T>(key: string, fallback: T): WritableSignal<T> {
    return this.persisted(signal(this.read(key, fallback)), key, (value) => value);
  }

  /** Igual que `signal`, pero para conjuntos de ids, que se guardan como lista. */
  idSet(key: string): WritableSignal<ReadonlySet<string>> {
    const state = signal<ReadonlySet<string>>(new Set(this.read<string[]>(key, [])));
    return this.persisted(state, key, (value) => [...value]);
  }

  /**
   * Envuelve `set` y `update` para que cada escritura llegue al
   * almacenamiento. `serialize` adapta lo que no es JSON por sí mismo, como un
   * `Set` o un `Map`.
   */
  persisted<T>(
    state: WritableSignal<T>,
    key: string,
    serialize: (value: T) => unknown,
  ): WritableSignal<T> {
    const set = state.set.bind(state);
    const update = state.update.bind(state);

    state.set = (value: T) => {
      set(value);
      this.write(key, serialize(value));
    };
    state.update = (fn: (value: T) => T) => {
      update(fn);
      this.write(key, serialize(state()));
    };
    return state;
  }
}

function readStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    const probe = '__yaph__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Safari en privado lanza al escribir, no al leer: por eso se prueba.
    return null;
  }
}
