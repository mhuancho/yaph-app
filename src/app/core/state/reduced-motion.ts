import { DestroyRef, inject, Service, signal } from '@angular/core';

/**
 * Expone `prefers-reduced-motion` como signal.
 *
 * El CSS ya neutraliza las animaciones decorativas; esto existe para las
 * decisiones que solo se pueden tomar en TS (no autorreproducir video, no
 * animar el scroll al cambiar de clip).
 */
@Service()
export class ReducedMotion {
  private readonly query = readQuery();
  readonly enabled = signal(this.query?.matches ?? false);

  constructor() {
    const query = this.query;
    if (!query) return;

    const onChange = (event: MediaQueryListEvent) => this.enabled.set(event.matches);
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }

  /** `'smooth'` o `'auto'` según la preferencia, listo para `scrollIntoView`. */
  scrollBehavior(): ScrollBehavior {
    return this.enabled() ? 'auto' : 'smooth';
  }
}

function readQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia('(prefers-reduced-motion: reduce)');
}
