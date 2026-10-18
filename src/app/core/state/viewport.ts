import { DestroyRef, inject, Service, signal } from '@angular/core';

/**
 * El punto de ruptura que decide si existe la columna derecha.
 * 64rem es el `lg` de Tailwind: debe coincidir con el `lg:` del armazón.
 */
const SIDE_PANEL_QUERY = '(min-width: 64rem)';

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
  private readonly query = readQuery();
  readonly hasSidePanel = signal(this.query?.matches ?? false);

  constructor() {
    const query = this.query;
    if (!query) return;

    const onChange = (event: MediaQueryListEvent) => this.hasSidePanel.set(event.matches);
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }
}

function readQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(SIDE_PANEL_QUERY);
}
