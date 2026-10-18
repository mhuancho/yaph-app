import { DestroyRef, inject, Service, signal, WritableSignal } from '@angular/core';

/**
 * El punto de ruptura que decide si existe la columna derecha.
 * 64rem es el `lg` de Tailwind: debe coincidir con el `lg:` del armazón.
 */
const SIDE_PANEL_QUERY = '(min-width: 64rem)';

/** Por debajo del `md` de Tailwind no caben dos paneles uno al lado del otro. */
const COMPACT_QUERY = '(max-width: 47.9375rem)';

/**
 * Expone como signal si la ventana tiene columna derecha.
 *
 * La presentación se resuelve en CSS siempre que se puede, pero el hilo de
 * comentarios cambia de *comportamiento*, no solo de aspecto: en la columna
 * derecha es una región más de la página y en pantallas pequeñas es un diálogo
 * modal. Esa diferencia no se puede expresar con una media query.
 */
@Service()
export class Viewport {
  readonly hasSidePanel = signal(false);
  /** Pantalla estrecha: las vistas maestro-detalle muestran una cosa u otra. */
  readonly isCompact = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    track(SIDE_PANEL_QUERY, this.hasSidePanel, destroyRef);
    track(COMPACT_QUERY, this.isCompact, destroyRef);
  }
}

function track(query: string, target: WritableSignal<boolean>, destroyRef: DestroyRef): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

  const list = window.matchMedia(query);
  target.set(list.matches);

  const onChange = (event: MediaQueryListEvent) => target.set(event.matches);
  list.addEventListener('change', onChange);
  destroyRef.onDestroy(() => list.removeEventListener('change', onChange));
}
